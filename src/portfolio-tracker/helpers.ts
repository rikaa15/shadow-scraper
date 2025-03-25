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
    depositAsset0: '',
    depositAsset1: '',
    depositAmount0: '',
    depositAmount1: '',
    depositValue0: '',
    depositValue1: '',
    depositValue: '',
    rewardAsset0: '',
    rewardAsset1: '',
    rewardAmount0: '',
    rewardAmount1: '',
    rewardValue0: '',
    rewardValue1: '',
    rewardValue: '',
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
      existing.amount = (new Decimal(existing.amount).add(new Decimal(reward.amount))).toFixed();
      existing.value = (new Decimal(existing.value).add(new Decimal(reward.value))).toFixed();
    } else {
      rewardMap.set(reward.asset, { ...reward });
    }
  });

  return Array.from(rewardMap.values());
}

export const formatFinancialValue = (
  valueStr: string,
  breakpoint = '0.000001',
  dp = 6
) => {
  const value = new Decimal(valueStr);
  const breakValue = new Decimal(breakpoint)

  if(value.eq(0)) {
    return '0'
  } else if(value.lt(breakValue)) {
    return `<${breakValue.toString()}`
  }
  return value.toDecimalPlaces(dp).toFixed()
}
