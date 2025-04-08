import {ethers} from "ethers";
import {PortfolioItem} from "../types";
const EulerEVaultABI = require('../../abi/EulerEVault.json');
const FiatTokenV2_ABI = require('../../abi/FiatTokenV2_2_Euler.json');

const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");
const vaultAddress = '0x196F3C7443E940911EE2Bb88e019Fd71400349D9'
const vault = new ethers.Contract(vaultAddress, EulerEVaultABI, provider);

export const getEulerInfo = async (
  walletAddress: string
) => {
  const assetAddress = await vault.asset() as string
  const assetContract = new ethers.Contract(assetAddress, FiatTokenV2_ABI, provider);
  const rewardAsset0 = await assetContract.symbol() as string
  const depositAsset0 = rewardAsset0
  const decimals = Number(await assetContract.decimals() as bigint)
  const sharesBalance = await vault.balanceOf(walletAddress)
  const assetsAmount = await vault.convertToAssets(sharesBalance) as bigint
  console.log('assetsAmount', assetsAmount, 'rewardAsset0', rewardAsset0)

  const portfolioItems: PortfolioItem[] = []

  return portfolioItems
}
