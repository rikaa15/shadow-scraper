import { ethers } from "ethers";
import BeefyVaultABI from './BeefyVaultV7.json'
import ERC20_ABI from '../../abi/ERC20.json'
import Decimal from "decimal.js";
import { calculateAPR, calculateDaysDifference, portfolioItemFactory, roundToSignificantDigits } from "../helpers";
import moment from "moment";
import { PortfolioItem } from "../types";
import { getBeefyVaultByAddress, getPpfsPrice } from "../../api/beefy-api";
import { calculateBeefyAPY } from "./helper";


const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");

const VAULT_ADDRESS = '0x0f61600BAE509820207827b7e3d108ceeeB23C48';

/**
 * Get Beefy vault transaction history for a user
 * @param vaultAddress The Beefy vault contract address
 * @param userAddress The user's wallet address
 */
export const getBeefyTransactionHistory = async (
  vaultAddress: string,
  userAddress: string
): Promise<any[]> => {
  try {

    // return [
    //   {
    //     txHash: '0xc32fe0b78dab2562714cf180b497b8559deca37bb5da49f7b4c3cee239f4609b',
    //     blockNumber: 23364608,
    //     timestamp: '2025-04-30T20:23:28.000Z',
    //     type: 'deposit',
    //     mooTokenAmount: '0.000000000765091876',
    //     gasUsed: '1918775',
    //     successful: true
    //   }
    // ]

    // Format addresses
    const formattedUserAddress = ethers.getAddress(userAddress);
    const formattedVaultAddress = ethers.getAddress(vaultAddress);
    
    // Create contract instance for getting token details
    const vault = new ethers.Contract(vaultAddress, BeefyVaultABI, provider);
    const assetAddress = await vault.want();
    const assetContract = new ethers.Contract(assetAddress, ERC20_ABI, provider);
    const assetDecimals = Number(await assetContract.decimals());
    const vaultDecimals = Number(await vault.decimals());
    
    // Create filters for both deposit and withdrawal events
    // For deposits: Look for Transfer events FROM the vault TO the user (user receives mooTokens)
    const depositFilter = {
      address: formattedVaultAddress,
      topics: [
        ethers.id("Transfer(address,address,uint256)"),
        null, // from address (any)
        ethers.zeroPadValue(formattedUserAddress.toLowerCase(), 32) // to address (user)
      ]
    };
    
    // For withdrawals: Look for Transfer events FROM the user TO the vault or other addresses
    const withdrawalFilter = {
      address: formattedVaultAddress,
      topics: [
        ethers.id("Transfer(address,address,uint256)"),
        ethers.zeroPadValue(formattedUserAddress.toLowerCase(), 32), // from address (user)
        null // to address (any)
      ]
    };
    
    // Set a reasonable block range - adjust based on blockchain
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = currentBlock - 900000; // About 1-2 weeks of blocks on most chains
    
    // Get events
    const depositEvents = await provider.getLogs({
      ...depositFilter,
      fromBlock,
      toBlock: "latest"
    });
    
    console.log(`Found ${depositEvents.length} deposit events`);
    
    // Process events
    const allEvents = [...depositEvents];
    
    // Sort events by block number (ascending order)
    allEvents.sort((a, b) => Number(a.blockNumber) - Number(b.blockNumber));
    
    // Process the events
    const transactions = await Promise.all(allEvents.map(async (event) => {
      const block = await provider.getBlock(event.blockNumber);
      const txReceipt = await provider.getTransactionReceipt(event.transactionHash);
      const timestamp = block?.timestamp || 0;
      
      // Decode the amount from the data
      const decodedData = ethers.AbiCoder.defaultAbiCoder().decode(['uint256'], event.data);
      const tokenAmount = decodedData[0];
      
      // Check if this is a deposit or withdrawal
      const isDeposit = event.topics[1] !== ethers.zeroPadValue(formattedUserAddress.toLowerCase(), 32);
      
      return {
        txHash: event.transactionHash,
        blockNumber: event.blockNumber,
        timestamp: new Date(Number(timestamp) * 1000),
        type: isDeposit ? 'deposit' : 'withdrawal',
        mooTokenAmount: ethers.formatUnits(tokenAmount, vaultDecimals),
        gasUsed: txReceipt?.gasUsed?.toString() || '0',
        successful: txReceipt?.status === 1
      };
    }));
    
    return transactions;
  } catch (error) {
    console.error("Error getting transaction history:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    return [];
  }
};

/**
 * Get Beefy vault position information
 * This is most similar to your getEulerInfo function
 * 
 * @param walletAddress User's wallet address
 * @param vaultAddress Vault's address
 * @returns Array of portfolio items with position details
 */
export const getBeefyInfo = async (walletAddress: string, vaultAddress = VAULT_ADDRESS) => {
  try {
    const portfolioItems: PortfolioItem[] = [];

    // Format wallet address
    const formattedWalletAddress = ethers.getAddress(walletAddress);
    
    // Create contract instances
    const vault = new ethers.Contract(vaultAddress, BeefyVaultABI, provider);
    const assetAddress = await vault.want();
    const assetContract = new ethers.Contract(assetAddress, ERC20_ABI, provider);
    
    // Get token details
    const assetSymbol = await assetContract.symbol();
    const assetDecimals = Number(await assetContract.decimals());
    const vaultDecimals = Number(await vault.decimals());
    
    console.log(`Asset Decimals: ${assetDecimals}, Vault Decimals: ${vaultDecimals}`);
    
    // Get user's mooToken balance (shares)
    const sharesBalance = await vault.balanceOf(formattedWalletAddress);
    
    // If no balance, return empty array
    if (sharesBalance === 0n) {
      return [];
    }
    
    const currentPPFS = await vault.getPricePerFullShare() as bigint;
    const transactions = await getBeefyTransactionHistory(vaultAddress, formattedWalletAddress);
    const firstDeposit = transactions.find(tx => tx.type === 'deposit');
    
    const depositPpfsPrice = await getPpfsPrice(vaultAddress, firstDeposit.timestamp, firstDeposit.blockNumber)
    const depositPPFS = depositPpfsPrice ? BigInt(Math.floor(+depositPpfsPrice.ppfsPrice * 1e18)) : 0n
    if (firstDeposit) { 
      console.log(sharesBalance, currentPPFS)
      const currentUnderlyingTokens = (sharesBalance * currentPPFS) / (10n ** 18n);
      const initialUnderlyingTokens = (sharesBalance * depositPPFS) / (10n ** 18n);
      const gains = currentUnderlyingTokens - initialUnderlyingTokens;

      const depositedTotal = Number(initialUnderlyingTokens);
      const totalRewards = Number(gains);

      const depositDate = new Date(firstDeposit.timestamp);
      const currentDate = new Date();
      const daysElapsed = (currentDate.getTime() - depositDate.getTime()) / (1000 * 60 * 60 * 24);
      const apr = calculateAPR(depositedTotal, totalRewards, daysElapsed);
      const apy = calculateBeefyAPY(currentUnderlyingTokens, initialUnderlyingTokens, firstDeposit.timestamp)

      const portfolioItem: PortfolioItem = {
        ...portfolioItemFactory(),
        type: 'Vault',  // Since this is a Beefy vault, not an LP
        name: 'beefy',
        address: vaultAddress,
        depositTime: moment(firstDeposit.timestamp).format('YY/MM/DD HH:MM:SS'),
        depositAsset0: assetSymbol, 
        depositAsset1: '',  // Empty for single-asset vaults
        depositAmount0: ethers.formatUnits(initialUnderlyingTokens, assetDecimals),
        depositAmount1: '',
        depositValue0: ethers.formatUnits(initialUnderlyingTokens, assetDecimals),
        depositValue1: '',
        depositValue: ethers.formatUnits(initialUnderlyingTokens, assetDecimals), // Total USD value
        rewardAsset0: assetSymbol,  // For Beefy, rewards are in the same asset
        rewardAsset1: '',
        rewardAmount0: ethers.formatUnits(gains, assetDecimals),
        rewardAmount1: '',
        rewardValue0: ethers.formatUnits(gains, assetDecimals), 
        rewardValue1: '',
        rewardValue: ethers.formatUnits(gains, assetDecimals), 
        totalDays: roundToSignificantDigits(`${daysElapsed}`, 4),
        totalBlocks: '', 
        apr: roundToSignificantDigits(apr.toString(), 2),
        depositLink: 'link' 
      };
      console.log(portfolioItem)
      portfolioItems.push(portfolioItem);
      return portfolioItems;

    }
  } catch (error) {
    console.error("Error getting Beefy info:", error);
    return null;
  }
};
