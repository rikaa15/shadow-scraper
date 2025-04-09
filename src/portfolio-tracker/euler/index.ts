import {ethers} from "ethers";
import {PortfolioItem} from "../types";
import {getEulerDeposits} from "../../api/euler-subgraph";
import Decimal from "decimal.js";
import {calculateAPR, calculateDaysDifference, portfolioItemFactory, roundToSignificantDigits} from "../helpers";
import moment from "moment";
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

  const deposits = await getEulerDeposits(walletAddress)
  const firstDeposit = deposits[deposits.length - 1]
  let totalDepositAmount = deposits.reduce((acc, item) => {
    return acc + Number(item.assets) / Math.pow(10, decimals)
  }, 0)
  const depositAmount0 = String(totalDepositAmount)

  const portfolioItems: PortfolioItem[] = []
  if(assetsAmount > 0n) {
    const depositTimestamp = firstDeposit
      ? Number(firstDeposit.blockTimestamp) * 1000
      : 0
    const depositValue0 = depositAmount0
    const rewardAmount0 = new Decimal(assetsAmount.toString()).div(10 ** decimals)
      .sub(new Decimal(depositAmount0))
      .toString()
    const rewardValue0 = rewardAmount0

    const currentBlockNumber = await provider.getBlockNumber()
    const depositBlockNumber = firstDeposit ? firstDeposit.blockNumber : '0'

    const portfolioItem: PortfolioItem = {
      ...portfolioItemFactory(),
      type: 'Swap pool',
      name: 'silo',
      address: vaultAddress,
      depositTime: moment(depositTimestamp).format('YY/MM/DD HH:MM:SS'),
      depositAsset0: depositAsset0,
      depositAsset1: '',
      depositAmount0: roundToSignificantDigits(depositAmount0),
      depositAmount1: '',
      depositValue0: roundToSignificantDigits(depositValue0),
      depositValue1: '',
      depositValue: roundToSignificantDigits(depositValue0),
      rewardAsset0: rewardAsset0,
      rewardAsset1: '',
      rewardAmount0: roundToSignificantDigits(rewardAmount0),
      rewardAmount1: '',
      rewardValue0: roundToSignificantDigits(rewardValue0),
      rewardValue1: '',
      rewardValue: roundToSignificantDigits(rewardValue0),
      totalDays: calculateDaysDifference(new Date(depositTimestamp), new Date(), 4),
      totalBlocks: (currentBlockNumber - Number(depositBlockNumber)).toString(),
      depositLink: `https://app.euler.finance/vault/${vaultAddress}?network=sonic`
    }

    const apr = calculateAPR(
      Number(portfolioItem.depositValue),
      Number(portfolioItem.rewardValue),
      Number(portfolioItem.totalDays)
    )
    portfolioItem.apr = roundToSignificantDigits(apr.toString())

    portfolioItems.push(portfolioItem)
  }

  return portfolioItems
}
