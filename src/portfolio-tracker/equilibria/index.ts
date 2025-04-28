import { ethers } from "ethers";
import Decimal from "decimal.js";
import { PortfolioItem } from "../types";
import moment from "moment";
import { 
  calculateTokenAPR, 
  findPoolId, 
  getTokenInfo,
} from './equilibriaHelper';
import { portfolioItemFactory, roundToSignificantDigits, calculateDaysDifference } from "../helpers";

// Setup provider
const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");

// Contract addresses
const MARKET_LP = '0x6e4e95fab7db1f0524b4b0a05f0b9c96380b7dfa'; // PT-wstscUSD Market

const DEPOSIT_LINK = 'https://equilibria.fi/dashboard';

const baseRewardPoolABI = [
  'function getRewardTokens() view returns (address[])',
  'function earned(address user, address rewardToken) view returns (uint256)',
  'function balanceOf(address user) view returns (uint256)'
];

async function getUnclaimedRewards(rewardPoolAddress: string, userAddress: string) {
  // Create contract instance
  const rewardPoolContract = new ethers.Contract(
    rewardPoolAddress,
    baseRewardPoolABI,
    provider
  );

  // Get reward tokens
  const rewardTokens = await rewardPoolContract.getRewardTokens();

  console.log(`Found ${rewardTokens.length} reward tokens`);

  // Get earned amounts for each token
  const rewards = await Promise.all(
    rewardTokens.map(async (token: string) => {
      const earned = await rewardPoolContract.earned(userAddress, token);

      const tokenInfo = await getTokenInfo(token);
      const amount = new Decimal(earned.toString()).div(10 ** tokenInfo.decimals);

      return {
        token,
        symbol: tokenInfo.symbol,
        decimals: tokenInfo.decimals,
        amount,
        raw: earned
      };
    })
  );

  return rewards;
}

export async function getEquilibriaInfo(userAddress: string, marketAddress: string = MARKET_LP) {
  try {
    const portfolioItems: PortfolioItem[] = [];
    
    console.log(`Finding pool ID for Market LP: ${marketAddress}`);
    const { poolId, token, rewardPool } = await findPoolId(marketAddress);
    console.log(`Found pool ID: ${poolId} with deposit token: ${token} and reward pool: ${rewardPool}`);

    // Get token info
    const depositTokenInfo = await getTokenInfo(token);
    
    // Create reward pool contract
    const rewardPoolContract = new ethers.Contract(
      rewardPool,
      baseRewardPoolABI,
      provider
    );
    
    // Get user's balance in the reward pool
    const userBalance = await rewardPoolContract.balanceOf(userAddress);
    
    // If user has no balance, return empty array
    if (userBalance === 0n) {
      return portfolioItems;
    }

    console.log(`\nGetting unclaimed rewards for user: ${userAddress}`);
    const rewards = await getUnclaimedRewards(rewardPool, userAddress);

    console.log('\nUnclaimed Rewards:');
    rewards.forEach((reward) => {
      console.log(`${reward.symbol}: ${reward.amount.toString()} (${reward.token})`);
    });

    // Get the current block for timestamp
    const currentBlock = await provider.getBlock('latest');
    const currentTimestamp = currentBlock ? currentBlock.timestamp * 1000 : Date.now();
    
    // Since we don't have actual deposit data, we'll use an estimate
    // In a real scenario, you'd want to query deposit events
    const depositTimestamp = currentTimestamp - (30 * 24 * 60 * 60 * 1000); // Assume deposit was 30 days ago
    const depositAmount = ethers.formatUnits(userBalance, depositTokenInfo.decimals);
    const depositDate = new Date(depositTimestamp);
    
    // Process rewards
    const mainReward = rewards[0]; // First reward token (usually PENDLE)
    let secondaryReward = rewards[1]; // Second reward token (if exists)
    
    // Calculate APR for main reward
    const aprResult = await calculateTokenAPR(
      mainReward.token,
      mainReward.symbol,
      mainReward.amount,
      parseFloat(depositAmount),
      depositDate
    );
    
    // Calculate secondary APR if available
    let secondaryAprResult = {
      tokenPrice: 0,
      apr: 0,
      daysSinceDeposit: aprResult.daysSinceDeposit
    };
    
    if (secondaryReward) {
      secondaryAprResult = await calculateTokenAPR(
        secondaryReward.token,
        secondaryReward.symbol,
        secondaryReward.amount,
        parseFloat(depositAmount),
        depositDate
      );
    }
    
    // Calculate total APR
    const totalApr = aprResult.apr + (secondaryAprResult ? secondaryAprResult.apr : 0);
    
    // Create portfolio item
    const portfolioItem: PortfolioItem = {
      ...portfolioItemFactory(),
      type: 'LP',
      name: 'equilibria',
      address: marketAddress,
      depositTime: moment(depositTimestamp).format('YY/MM/DD HH:MM:SS'),
      depositAsset0: depositTokenInfo.symbol,
      depositAsset1: '',
      depositAmount0: roundToSignificantDigits(depositAmount),
      depositAmount1: '',
      depositValue0: roundToSignificantDigits(depositAmount),
      depositValue1: '',
      depositValue: roundToSignificantDigits(depositAmount),
      rewardAsset0: mainReward.symbol,
      rewardAsset1: secondaryReward ? secondaryReward.symbol : '',
      rewardAmount0: roundToSignificantDigits(mainReward.amount.toString()),
      rewardAmount1: secondaryReward ? roundToSignificantDigits(secondaryReward.amount.toString()) : '',
      rewardValue0: roundToSignificantDigits(
        mainReward.amount.mul(aprResult.tokenPrice).toString()
      ),
      rewardValue1: secondaryReward && secondaryAprResult ? 
        roundToSignificantDigits(
          secondaryReward.amount.mul(secondaryAprResult.tokenPrice).toString()
        ) : '',
      rewardValue: roundToSignificantDigits(
        mainReward.amount.mul(aprResult.tokenPrice)
          .add(secondaryReward && secondaryAprResult ? 
            secondaryReward.amount.mul(secondaryAprResult.tokenPrice) : 0)
          .toString()
      ),
      totalDays: calculateDaysDifference(new Date(depositTimestamp), new Date(), 4),
      totalBlocks: '0', // We don't have this info readily available
      apr: roundToSignificantDigits(totalApr.toString()),
      depositLink: DEPOSIT_LINK
    };
    
    portfolioItems.push(portfolioItem);
    return portfolioItems;
    
  } catch (error) {
    console.error('Error getting Equilibria portfolio data:', error);
    return [];
  }
}