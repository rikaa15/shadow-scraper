import {CoinGeckoTokenIdsMap, getTokenPrices} from "../api/coingecko";
import Decimal from 'decimal.js'
import {PortfolioItem, PositionReward} from "./types";

export const setUSDValues = async (
  items: PortfolioItem[]
) => {
  return items
  // const exchangeTokenIds = items.map(item => {
  //   const key = item.asset.toLowerCase()
  //   return CoinGeckoTokenIdsMap[key]
  // }).filter(_ => _)
  //
  // const tokenPrices = await getTokenPrices(exchangeTokenIds)
  //
  // return items.map(item => {
  //   const key = item.asset.toLowerCase()
  //   const isXShadow = key.includes('xSHADOW'.toLowerCase())
  //   const tokenId = CoinGeckoTokenIdsMap[key]
  //   if(tokenId || isXShadow) {
  //     if(tokenPrices[tokenId] || isXShadow) {
  //       const price = isXShadow
  //         ? (tokenPrices['shadow-2'].usd / 2)
  //         : tokenPrices[tokenId]['usd']
  //       if(price) {
  //         const value = new Decimal(item.balance)
  //           .mul(price)
  //           .toDecimalPlaces(6)
  //           .toString()
  //         return {
  //           ...item,
  //           price: `$${price}`,
  //           value: `$${value}`
  //         }
  //       }
  //     }
  //   }
  //   return {
  //     ...item,
  //     price: '0',
  //     value: '0'
  //   }
  // })
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

export const portfolioItemFactory = (): PortfolioItem => {
  return {
    asset: '',
    address: '',
    depositTime: '',
    deposit0Asset: '',
    deposit1Asset: '',
    deposit0Amount: '',
    deposit1Amount: '',
    deposit0Value: '',
    deposit1Value: '',
    reward0Asset: '',
    reward1Asset: '',
    reward0Amount: '',
    reward1Amount: '',
    reward0Value: '',
    reward1Value: '',
    totalDays: '',
    totalBlocks: '',
    apr: '',
    type: '',
    link: '',
  }
}

export const mergeRewards = (
  rewards1: PositionReward[],
  rewards2: PositionReward[],
): PositionReward[] => {
  const rewardMap = new Map<string, PositionReward>();

  rewards1.forEach(reward => {
    rewardMap.set(reward.asset, { ...reward });
  });

  rewards2.forEach(reward => {
    const existing = rewardMap.get(reward.asset);
    if (existing) {
      existing.amount = (parseFloat(existing.amount) + parseFloat(reward.amount)).toString();
      existing.value = (parseFloat(existing.value) + parseFloat(reward.value)).toString();
    } else {
      rewardMap.set(reward.asset, { ...reward });
    }
  });

  return Array.from(rewardMap.values());
}
