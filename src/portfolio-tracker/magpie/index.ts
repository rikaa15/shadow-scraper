import {ethers} from "ethers";
import {getTokenPrice} from "../../api/coingecko";
import Decimal from "decimal.js";
import {PortfolioItem} from "../types";
import {calculateAPR, calculateDaysDifference, portfolioItemFactory, roundToSignificantDigits} from "../helpers";
import moment from "moment/moment";
import {getTransactions} from "../../api/sonicscan";
const MasterPenpieABI = require('../../abi/MasterPenpie.json');
// const mPendleSVBaseRewarderABI = require('../../abi/mPendleSVBaseRewarder.json');
// Rewarder ABI: https://arbiscan.io/address/0xD51FDCcBEB6f69df92A0f0ee0141349E332FE670#code

// const vlPenpieBaseRewarderABI = require('../../abi/vlPenpieBaseRewarder.json');
// ABI: https://arbiscan.io/address/0x2854f036587c3f7F90d372f71fcD4B32616aD691#code

const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");
const masterPenpieProxyAddress = '0x664cc2BcAe1E057EB1Ec379598c5B743Ad9Db6e7'
const pendleMarket = '0x3f5ea53d1160177445b1898afbb16da111182418' // aUSDCLP
const poolHelper = '0x7A89614B596720D4D0f51A69D6C1d55dB97E9aAB'
const aUSDCLPPrice = '0.00000000000048905' // price of aUSDCLP amount of 1 aUSDC invested into pool
const lpTokenDecimals = 18
const rewardDecimals = 18

export const getMagpieInfo = async (
  walletAddress: string
) => {
  const penpie = new ethers.Contract(masterPenpieProxyAddress, MasterPenpieABI, provider);
  // const penpieRewarder2 = new ethers.Contract('0x1Bfaf418C13e36958b0b6736B27C3E8bC1F9bB91', mPendleSVBaseRewarderABI, provider);
  // const userInfo = await penpie.userInfo(stakingToken, walletAddress)
  // const tokenToPoolInfo = await penpie.tokenToPoolInfo(stakingToken)
  const stakingInfo = await penpie.stakingInfo(pendleMarket, walletAddress)
  const allPendingTokens = await penpie.allPendingTokens(pendleMarket, walletAddress)

  const depositLpAmount = stakingInfo[0] as bigint
  const depositLpAmountString = new Decimal(depositLpAmount.toString())
    .div(10 ** lpTokenDecimals)
    .toString()
  const depositLpValue = new Decimal(depositLpAmountString)
    .div(aUSDCLPPrice)

  const rewardSymbol = allPendingTokens[2][0] as string
  const rewardTokenPrice = await getTokenPrice(rewardSymbol.toLowerCase())
  const rewardAmount = new Decimal((allPendingTokens[3][0] as bigint).toString())
    .div(10 ** rewardDecimals)
  const rewardValue = rewardAmount.mul(rewardTokenPrice)

  if(depositLpValue.gt(0)) {
    const currentBlockNumber = await provider.getBlockNumber()

    // find first deposit tx
    const walletTxs = await getTransactions({
      address: walletAddress,
      sort: 'asc'
    })
    const depositTx = walletTxs.find(tx => {
      return tx.to.toLowerCase() === poolHelper.toLowerCase()
        && tx.functionName
        && tx.functionName.startsWith('depositMarket')
    })

    const depositTimestamp = Number(depositTx?.timeStamp || '0') * 1000
    const depositBlockNumber = depositTx?.blockNumber || '0'

    const portfolioItem: PortfolioItem = {
      ...portfolioItemFactory(),
      type: `Swap pool`,
      name: 'magpie pendle',
      address: pendleMarket,
      depositTime: moment(depositTimestamp).format('YY/MM/DD HH:MM:SS'),
      depositAsset0: 'aUSDC LP',
      depositAsset1: '',
      depositAmount0: roundToSignificantDigits(depositLpAmountString),
      depositAmount1: '',
      depositValue0: roundToSignificantDigits(depositLpValue.toString()),
      depositValue1: '',
      depositValue: roundToSignificantDigits(depositLpValue.toString()),
      rewardAsset0: rewardSymbol,
      rewardAsset1: '',
      rewardAmount0: roundToSignificantDigits(rewardAmount.toString()),
      rewardAmount1: '',
      rewardValue0: roundToSignificantDigits(rewardValue.toString()),
      rewardValue1: '',
      rewardValue: roundToSignificantDigits(rewardValue.toString()),
      totalDays: calculateDaysDifference(
        new Date(moment(depositTimestamp).toDate()),
        new Date(),
        4
      ),
      totalBlocks: (currentBlockNumber - Number(depositBlockNumber)).toString(),
      depositLink: `https://www.pendle.magpiexyz.io/stake/${pendleMarket}`
    }

    const apr = calculateAPR(
      Number(portfolioItem.depositValue),
      Number(portfolioItem.rewardValue),
      Number(portfolioItem.totalDays)
    )
    portfolioItem.apr = roundToSignificantDigits(apr.toString())

    return [portfolioItem]
  }

  return []
}
