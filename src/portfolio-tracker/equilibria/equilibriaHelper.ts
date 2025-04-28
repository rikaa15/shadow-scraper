import Decimal from "decimal.js";
import { ethers } from "ethers";
import erc20Abi from '../../abi/ERC20.json'
import {getTokenPrice} from "../../api/coingecko";

// Setup provider
const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
}

const PENDLE_BOOSTER = '0x920873E5b302A619C54c908aDFB77a1C4256A3B8'

const pendleBoosterABI = [
  'function poolLength() view returns (uint256)',
  'function poolInfo(uint256) view returns (address lpToken, address token, address rewardPool, bool shutdown)',
];



// Cache for token and market information to reduce RPC calls
const tokenCache = new Map<string, TokenInfo>();

/**
 * Get token symbol
 */
export async function getTokenSymbol(tokenAddress: string): Promise<string> {
  try {
    const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, provider);
    const symbol = await tokenContract.symbol() as string;
    return symbol;
  } catch (error) {
    console.error(`Error getting symbol for ${tokenAddress}:`, error);
    return 'Unknown';
  }
}

/**
 * Fetches token information from the blockchain
 */
export async function getTokenInfo(address: string): Promise<TokenInfo> {
  // Check cache first
  const cacheKey = address.toLowerCase();
  if (tokenCache.has(cacheKey)) {
    return tokenCache.get(cacheKey)!;
  }

  try {
    // Create contract instance
    const tokenContract = new ethers.Contract(address, erc20Abi, provider);
    
    // Fetch token details from contract
    const [name, symbol, decimals] = await Promise.all([
      tokenContract.name().catch(() => 'UNKNOWN'),
      tokenContract.symbol().catch(() => 'UNKNOWN'),
      tokenContract.decimals().catch(() => 18),
    ]);

    const tokenInfo: TokenInfo = {
      address,
      name: name as string,
      symbol: symbol as string,
      decimals: Number(decimals),  // Convert BigInt to Number
    };

    // Cache the result
    tokenCache.set(cacheKey, tokenInfo);
    return tokenInfo;
  } catch (error) {
    console.error(`Failed to fetch token info for ${address}:`, error);
    
    // Return a placeholder on error
    const fallbackInfo: TokenInfo = {
      address,
      name: 'Unknown Token',
      symbol: 'UNKNOWN',
      decimals: 18,
    };
    
    tokenCache.set(cacheKey, fallbackInfo);
    return fallbackInfo;
  }
}


export async function findPoolId(marketAddress: string): Promise<{ poolId: number; token: string; rewardPool: string }> {
  // Initialize contract
  const pendleBoosterContract = new ethers.Contract(PENDLE_BOOSTER, pendleBoosterABI, provider);
  
  // Get pool length
  const poolLength = await pendleBoosterContract.poolLength();

  // Iterate through pools to find the one matching our Market LP
  for (let i = 0; i < Number(poolLength); i++) {
    const poolInfo = await pendleBoosterContract.poolInfo(i);
    if (poolInfo[0].toLowerCase() === marketAddress.toLowerCase()) {
      return {
        poolId: i,
        token: poolInfo[1],
        rewardPool: poolInfo[2]
      };
    }
  }

  throw new Error(`Pool not found for Market LP: ${marketAddress}`);
}

export async function calculateTokenAPR(
  rewardToken: string,
  rewardSymbol: string,
  rewardAmount: Decimal,
  depositUSD: number,
  depositDate: Date
): Promise<any> {
  try {
    // Get current date for calculation
    const now = new Date();
    
    // Round down days since deposit (minimum 1 day to avoid division by zero)
    const daysSinceDeposit = Math.max(1, Math.floor((now.getTime() - depositDate.getTime()) / (1000 * 60 * 60 * 24)));

    const rewardTokenSymbol = await getTokenSymbol(rewardToken)

    const tokenPrice = await getTokenPrice(rewardTokenSymbol.toLowerCase())
    
    // Calculate reward value in USD
    const rewardValueUSD = rewardAmount.mul(tokenPrice);
    
    // Calculate APR: (reward value / deposit value) * 365 / days * 100
    const apr = rewardValueUSD.div(depositUSD).mul(365).div(daysSinceDeposit).mul(100);
    console.log(rewardValueUSD, depositUSD, daysSinceDeposit)
    console.log(`APR Calculation for ${rewardSymbol}:`);
    console.log(`- Reward amount: ${rewardAmount} ${rewardSymbol}`);
    console.log(`- Token price: $${tokenPrice}`);
    console.log(`- Reward value: $${rewardValueUSD}`);
    console.log(`- Deposit value: $${depositUSD}`);
    console.log(`- Days since deposit: ${daysSinceDeposit.toFixed(2)}`);
    console.log(`- Calculated APR: ${apr.toNumber().toFixed(2)}%`);
    
    return {
      tokenPrice,
      apr: apr.toNumber(),
      daysSinceDeposit
    }
  } catch (error) {
    console.error(`Error calculating APR for ${rewardSymbol}:`, error);
    return 0;
  }
}
