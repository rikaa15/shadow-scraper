import {CoinGeckoTokenIdsMap, getTokenPrices} from "../api/coingecko";
import {PortfolioItem} from "./index";
import Decimal from 'decimal.js'

export const setUSDValues = async (
  items: PortfolioItem[]
) => {
  const exchangeTokenIds = items.map(item => {
    const key = item.asset.toLowerCase()
    return CoinGeckoTokenIdsMap[key]
  }).filter(_ => _)

  const tokenPrices = await getTokenPrices(exchangeTokenIds)

  return items.map(item => {
    const key = item.asset.toLowerCase()
    const tokenId = CoinGeckoTokenIdsMap[key]
    if(tokenId) {
      const tokenPrice = tokenPrices[tokenId]
      if(tokenPrice) {
        const price = tokenPrice['usd']
        if(price) {
          const value = new Decimal(item.balance)
            .mul(price)
            .toDecimalPlaces(6)
            .toString()
          return {
            ...item,
            price: `$${price}`,
            value: `$${value}`
          }
        }
      }
    }
    return {
      ...item,
      price: '0',
      value: '0'
    }
  })
}

export const calculateAPR = (
  depositedTotalUSD: number,
  totalRewardsUSD: number,
  poolLaunchTimestamp: number
) => {
  if (depositedTotalUSD <= 0 || totalRewardsUSD < 0) {
    throw new Error("Deposited total must be positive and rewards cannot be negative.");
  }

  const start = new Date(poolLaunchTimestamp)
  const end = new Date();

  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const timeElapsedMs = end.getTime() - start.getTime();
  const daysElapsed = Math.ceil(timeElapsedMs / millisecondsPerDay);

  if (daysElapsed <= 0) {
    throw new Error("End date must be after the pool launch date.");
  }

  const returnRate = totalRewardsUSD / depositedTotalUSD;
  const annualizedRate = returnRate * (365 / daysElapsed);
  const apr = annualizedRate * 100;

  return Number(apr.toFixed(2));
}
