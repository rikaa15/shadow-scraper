import Decimal from "decimal.js";
import {getPositions, getGaugeRewardClaims} from "../../api";
import {PortfolioItem} from "../index";
import {ethers} from "ethers";
import {calculateAPR, portfolioItemFactory} from "../helpers";
import {CoinGeckoTokenIdsMap, getTokenPrice, getTokenPrices} from "../../api/coingecko";
const GaugeV3ABI = require('../../abi/GaugeV3.json');
const ERC20ABI = require('../../abi/ERC20.json');
import moment from 'moment'
import {ClPosition, GaugeRewardClaim} from "../../types";

// https://ethereum.stackexchange.com/questions/101955/trying-to-make-sense-of-uniswap-v3-fees-feegrowthinside0lastx128-feegrowthglob

const getPoolClaimedRewardsUSD = async (
  position: ClPosition,
  rewardClaims: GaugeRewardClaim[]
) => {
  const { pool } = position
  let totalRewardsUSD = 0

  const poolRewards = rewardClaims
    .filter((item) => {
      return item.gauge.clPool.symbol.toLowerCase() === pool.symbol.toLowerCase()
      && Number(item.transaction.timestamp) > Number(position.transaction.timestamp)
    })

  for(const reward of poolRewards) {
    const {rewardToken, rewardAmount} = reward
    const exchangeTokenId = CoinGeckoTokenIdsMap[rewardToken.symbol.toLowerCase()]
    let tokenPrice = 0
    if(rewardToken.symbol.toLowerCase() === 'xshadow') {
      tokenPrice = (await getTokenPrice('shadow-2')) / 2
    }
    if(exchangeTokenId) {
      tokenPrice = await getTokenPrice(exchangeTokenId)
      // await new Promise(resolve => setTimeout(resolve, 1000))
    }
    const rewardValueUSD = Decimal(reward.rewardAmount).mul(tokenPrice).toNumber()
    // console.log(`${reward.rewardToken.symbol}, rewardAmount=${rewardAmount}, USD value=${rewardValueUSD}`)
    totalRewardsUSD += rewardValueUSD
  }

  return totalRewardsUSD
}

export const getShadowInfo = async (
  userAddress: string
) => {
  const positions = await getPositions({
    filter: {
      liquidity_gt: 0,
      owner: userAddress
    }
  })

  const rewardClaims = await getGaugeRewardClaims({
    filter: {
      transaction_from: userAddress,
      gauge_isAlive: true
    },
    sort: {
      orderBy: 'transaction__blockNumber',
      orderDirection: 'desc'
    }
  })

  const portfolioItems: PortfolioItem[] = []
  const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");
  const gaugeContract = new ethers.Contract('0xe879d0e44e6873cf4ab71686055a4f6817685f02', GaugeV3ABI, provider);

  for (const position of positions) {
    const { id: positionId, pool, transaction } = position

    let unclaimedRewardsUSD = 0
    const launchTimestamp = Number(position.transaction.timestamp) * 1000

    const rewardTokens = (await gaugeContract.getRewardTokens()) as string[]
    for(const tokenAddress of rewardTokens) {
      const earned = await gaugeContract.earned(tokenAddress, positionId) as bigint

      if(earned > 0) {
        const rewardTokenContract = new ethers.Contract(tokenAddress, ERC20ABI, provider);
        const symbol = await rewardTokenContract.symbol()

        const exchangeTokenId = CoinGeckoTokenIdsMap[symbol.toLowerCase()]
        if(exchangeTokenId) {
          const price =  await getTokenPrice(exchangeTokenId)
          // await new Promise(resolve => setTimeout(resolve, 1000))
          if(price > 0) {
            const decimals = Number(await rewardTokenContract.decimals())
            const balance = new Decimal(earned.toString()).div(Math.pow(10, decimals))
            const balanceUSD = balance.mul(price)
            unclaimedRewardsUSD += balanceUSD.toNumber()
          }
        }
      }
    }

    if(unclaimedRewardsUSD > 0) {
      const claimedRewardsUSD = await getPoolClaimedRewardsUSD(position, rewardClaims)
      const totalRewardsUSD = claimedRewardsUSD + unclaimedRewardsUSD
      // console.log('unclaimedRewardsUSD', unclaimedRewardsUSD, 'claimedRewardsUSD', claimedRewardsUSD, 'totalRewards', totalRewards)

      const { depositedToken0, depositedToken1 } = position
      const exchangeToken0Id = CoinGeckoTokenIdsMap[pool.token0.symbol.toLowerCase()]
      const exchangeToken1Id = CoinGeckoTokenIdsMap[pool.token1.symbol.toLowerCase()]

      let apr = 0
      let depositedTotalUSD = 0
      if(exchangeToken0Id && exchangeToken1Id) {
        const tokenPrices = await getTokenPrices([exchangeToken0Id, exchangeToken1Id])
        await new Promise(resolve => setTimeout(resolve, 1000))
        const token0Price = tokenPrices[exchangeToken0Id]['usd']
        const token1Price = tokenPrices[exchangeToken1Id]['usd']
        const depositedToken0USD = token0Price * Number(depositedToken0)
        const depositedToken1USD = token1Price * Number(depositedToken1)
        depositedTotalUSD = depositedToken0USD + depositedToken1USD

        apr = calculateAPR(depositedTotalUSD, totalRewardsUSD, launchTimestamp)
      }

      // console.log(pool.symbol, 'APR:', apr, apr > 0, 'depositedTotalUSD', depositedTotalUSD,'totalRewardsUSD', totalRewardsUSD,  'launchTimestamp', launchTimestamp)

      if(apr > 0) {
        portfolioItems.push({
          ...portfolioItemFactory(),
          type: `Liquidity`,
          asset: `${pool.symbol} (Shadow Pool)`,
          address: pool.id,
          balance: '1',
          price: `$${new Decimal(depositedTotalUSD).toFixed()}`,
          value: `$${new Decimal(depositedTotalUSD).toFixed()}`,
          rewards: `$${new Decimal(totalRewardsUSD).toFixed()}`,
          apr: `${moment(launchTimestamp).format('DD MMM YYYY')} / ${apr.toString()}%`,
          link: `https://vfat.io/token?chainId=146&tokenAddress=${pool.id}`
        })
      }
    }
  }

  return portfolioItems
}
