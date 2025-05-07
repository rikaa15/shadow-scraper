import {getShadowInfo} from "../shadow";
import {getSwapXInfo} from "../swapx";
import {getMagpieInfo} from "../magpie";
import {getSiloInfo} from "../silo";
import {getEulerInfo} from "../euler";
import {getSpectraInfo} from "../spectra";
import {getBeefyInfo} from "../beefy";
import {PortfolioItem} from "../types";
import Decimal from "decimal.js";

const calculateCAGR = (
  start: number,
  end: number,
  periods: number,
) => {
  return (Math.pow((end / start), 1 / periods) - 1) * 100
}

export const getPortfolioMetrics = async (
  walletAddress: string
) => {
  const startValue = 10000
  const currentValue = 15000

  const portfolioItems = await Promise.all([
    getShadowInfo(walletAddress),
    getSwapXInfo(walletAddress),
    getMagpieInfo(walletAddress),
    getSiloInfo(walletAddress),
    getEulerInfo(walletAddress),
    getBeefyInfo(walletAddress)
  ])

  const items = portfolioItems
    .flat()
    .filter(item => Boolean(item)) as PortfolioItem[]

  const depositValueUSD = items.reduce((acc, item) => {
    const depositValue = new Decimal(item.depositValue)
    return acc.add(depositValue)
  }, new Decimal(0))

  const currentValueUSD = items.reduce((acc, item) => {
    const depositValue = new Decimal(item.depositValue)
    const rewardValue = new Decimal(item.rewardValue)
    const currentValue = depositValue.add(rewardValue)
    return acc.add(currentValue)
  }, new Decimal(0))

  console.log('depositValueUSD', depositValueUSD.toString())
  console.log('currentValueUSD', currentValueUSD.toString())

  const cagr = calculateCAGR(startValue, currentValue, 5)
  return {
    cagr
  }
}
