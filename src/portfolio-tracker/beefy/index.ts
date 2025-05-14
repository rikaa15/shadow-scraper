import { ethers } from "ethers";
import BeefyVaultABI from '../../abi/BeefyVaultV7.json'
import ERC20_ABI from '../../abi/ERC20.json'
import { calculateAPR, portfolioItemFactory, roundToSignificantDigits } from "../helpers";
import moment from "moment";
import { PortfolioItem } from "../types";
import { getBeefyVaultByAddress, getBeefyVaultUSDValue, getPpfsPrice } from "../../api/beefy-api";
import { calculateBeefyAPY } from "./helper";
import { getBeefyDeposits } from "../../api/beefy-subgraph";


const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");

const vaultArray = [
  {
    name: 'beefy',
    address:'0x0f61600BAE509820207827b7e3d108ceeeB23C48',
    url: 'https://app.beefy.com/vault/swapx-ichi-frxusd-scusd',
    type: 'vault'
  },
];

/**
 * Get Beefy vault position information
 * @param walletAddress User's wallet address
 * @param vaultAddress Vault's address
 * @returns Array of portfolio items with position details
 */
export const getBeefyInfo = async (walletAddress: string) => {
  const portfolioItems: PortfolioItem[] = [];

  // Format wallet address
  const formattedWalletAddress = ethers.getAddress(walletAddress);

  const vaultPromises = vaultArray.map(async (vault) => { 

    // Create contract instances
    const vaultContract = new ethers.Contract(vault.address, BeefyVaultABI, provider);
    const assetAddress = await vaultContract.want();

    const assetContract = new ethers.Contract(assetAddress, ERC20_ABI, provider);

    // Get token details
    const assetSymbol = await assetContract.symbol();

    // Get user's mooToken balance (shares)
    const sharesBalance = await vaultContract.balanceOf(formattedWalletAddress);


    const currentPPFS = await vaultContract.getPricePerFullShare() as bigint;
    const transactions = await getBeefyDeposits(walletAddress, vault.address)
    const firstDeposit = transactions[transactions.length - 1];
    if(!firstDeposit) {
      return null
    }
    const firstDepositTimestamp = new Date(parseInt(firstDeposit.timestamp) * 1000).toISOString();

    const depositPpfsPrice = await getPpfsPrice(vault.address, firstDepositTimestamp, firstDeposit.blockNumber)
    const depositPPFS = depositPpfsPrice ? BigInt(Math.floor(+depositPpfsPrice.ppfsPrice * 1e18)) : 0n
    const currentUnderlyingTokens = (sharesBalance * currentPPFS) / (10n ** 18n);
    const initialUnderlyingTokens = (sharesBalance * depositPPFS) / (10n ** 18n);
    const gains = currentUnderlyingTokens - initialUnderlyingTokens;
    const depositedTotal = Number(initialUnderlyingTokens);
    const totalRewards = Number(gains);
    const depositDate = new Date(firstDepositTimestamp);
    const currentDate = new Date();
    const daysElapsed = (currentDate.getTime() - depositDate.getTime()) / (1000 * 60 * 60 * 24);
    const apr = calculateAPR(depositedTotal, totalRewards, daysElapsed);
    const apy = calculateBeefyAPY(currentUnderlyingTokens, initialUnderlyingTokens, firstDepositTimestamp)

    // get the deposit and gain value in USD
    const initialDepositUSD = await getBeefyVaultUSDValue(vault.address, initialUnderlyingTokens)
    const gainsInUSD =  await getBeefyVaultUSDValue(vault.address, gains)

    const currentBlockNumber = await provider.getBlockNumber();
    const totalBlocks = currentBlockNumber - +firstDeposit.blockNumber;
    const portfolioItem: PortfolioItem = {
      ...portfolioItemFactory(),
      type: vault.type,
      name: vault.name,
      address: vault.address,
      depositTime: moment(firstDepositTimestamp).format('YY/MM/DD HH:MM:SS'),
      depositAsset0: assetSymbol,
      depositAsset1: '',  // Empty for single-asset vaults
      depositAmount0: roundToSignificantDigits(`${initialDepositUSD}`, 3),
      depositAmount1: '',
      depositValue0: roundToSignificantDigits(`${initialDepositUSD}`, 3),
      depositValue1: '',
      depositValue: roundToSignificantDigits(`${initialDepositUSD}`, 3),
      rewardAsset0: assetSymbol,  // For Beefy, rewards are in the same asset
      rewardAsset1: '',
      rewardAmount0: roundToSignificantDigits(`${gainsInUSD}`, 4),
      rewardAmount1: '',
      rewardValue0: roundToSignificantDigits(`${gainsInUSD}`, 4),
      rewardValue1: '',
      rewardValue: roundToSignificantDigits(`${gainsInUSD}`, 4),
      totalDays: roundToSignificantDigits(`${daysElapsed}`, 4),
      totalBlocks: `${totalBlocks}`,
      apr: roundToSignificantDigits(apr.toString(), 4),
      depositLink: vault.url
    };

    return portfolioItem
  })

  

  // console.log(`\nVault: ${vaultInfo?.name}`)
  // console.log(`User ${walletAddress}`)
  // console.log('Deposit Time:', moment(firstDepositTimestamp).format('YY/MM/DD HH:MM:SS'))
  // console.log('Deposit amount:', roundToSignificantDigits(`${initialDepositUSD}`, 3))
  // console.log('Total Days:', roundToSignificantDigits(`${daysElapsed}`, 4))
  // console.log('Earings:', roundToSignificantDigits(`${gainsInUSD}`, 4))
  // console.log(`APY: ${apy}%`)
  // console.log(`APR: ${apr}%\n`)

  const results = await Promise.all(vaultPromises);

  results.forEach(item => {
    if (item) portfolioItems.push(item);
  });

  return portfolioItems;

};
