// https://ethereum.stackexchange.com/questions/101955/trying-to-make-sense-of-uniswap-v3-fees-feegrowthinside0lastx128-feegrowthglob
import axios from "axios";
import Decimal from "decimal.js";
import {getPositions, getGaugeRewardClaims} from "../../api";
import {PortfolioItem} from "../index";
import {ethers} from "ethers";
const GaugeV3ABI = require('../../abi/GaugeV3.json');
const ERC20ABI = require('../../abi/ERC20.json');

// const calculateTokenFees = (
//   feeGrowthOutside0X128Upper: string,
//   feeGrowthOutside0X128Lower: string,
//   liquidity: string,
//   decimals: string
// ) => {
//   const feeGrowthOutside0X128_upper = new Decimal(feeGrowthOutside0X128Upper)
//   const feeGrowthOutside0X128_lower = new Decimal(feeGrowthOutside0X128Lower)
//
//   const feeGrowthInside0 = feeGrowthOutside0X128_lower.sub(feeGrowthOutside0X128_upper)
//
//   return (feeGrowthInside0.mul(new Decimal(liquidity)))
//     .div(new Decimal(2).pow(128))
//     .div(Math.pow(10, Number(decimals)))
//     .toString()
// }

export const getShadowInfo = async (
  userAddress: string
) => {
  const positions = await getPositions({
    filter: {
      liquidity_gt: 0,
      owner: userAddress
    }
  })

  // const rewardClaims = await getGaugeRewardClaims({
  //   filter: {
  //     transaction_from: userAddress,
  //     gauge_isAlive: true
  //   }
  // })

  const portfolioItems: PortfolioItem[] = []
  const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");
  const gaugeContract = new ethers.Contract('0xe879d0e44e6873cf4ab71686055a4f6817685f02', GaugeV3ABI, provider);

  // let portfolioFromRewards: Record<string, PortfolioItem> = {}
  //
  // for(const rewardClaim of rewardClaims) {
  //   const { nfpPositionHash, rewardAmount, rewardToken, gauge: { pool } } = rewardClaim
  //
  //   const key = `${nfpPositionHash}_${rewardToken.id}`
  //   const existedItem = portfolioFromRewards[key]
  //   if(!existedItem) {
  //     portfolioFromRewards[key] = {
  //       asset: `CL${pool.symbol}`,
  //       address: rewardToken.id,
  //       balance: rewardAmount,
  //       price: '', // USD price
  //       value: '', // value in USD
  //       time: '', // only for pools
  //       type: `Liquidity (Shadow)`,
  //       link: `https://vfat.io/token?chainId=146&tokenAddress=${rewardToken.id}`
  //     }
  //   } else {
  //     portfolioFromRewards[key] = {
  //       ...existedItem,
  //       balance: new Decimal(existedItem.balance).add(rewardAmount).toFixed()
  //     }
  //   }
  // }

  for (const position of positions) {
    const { id: positionId, pool, transaction } = position

    const rewardTokens = (await gaugeContract.getRewardTokens()) as string[]
    for(const tokenAddress of rewardTokens) {
      const earned = await gaugeContract.earned(tokenAddress, positionId) as bigint

      if(earned > 0) {
        const rewardTokenContract = new ethers.Contract(tokenAddress, ERC20ABI, provider);
        const symbol = await rewardTokenContract.symbol()
        const decimals = Number(await rewardTokenContract.decimals())
        const balance = new Decimal(earned.toString())
          .div(Math.pow(10, decimals))
          .toDecimalPlaces(6)
          .toString()
        portfolioItems.push({
          type: `Pending Reward (Shadow ${pool.symbol})`,
          asset: symbol,
          address: tokenAddress,
          balance,
          price: '',
          value: '',
          time: transaction.timestamp,
          link: `https://vfat.io/token?chainId=146&tokenAddress=${tokenAddress}`
        })
      }
    }
  }

  return portfolioItems
}
