import Decimal from "decimal.js";
import {getPositions, getGaugeRewardClaims} from "../../api";
import {ethers} from "ethers";
import {calculateAPR, mergeRewards, portfolioItemFactory} from "../helpers";
import {CoinGeckoTokenIdsMap, getTokenPrice, getTokenPrices} from "../../api/coingecko";
const GaugeV3ABI = require('../../abi/GaugeV3.json');
const ERC20ABI = require('../../abi/ERC20.json');
import moment from 'moment'
import {ClPosition, GaugeRewardClaim} from "../../types";
import {PortfolioItem, PositionReward} from "../types";

// https://ethereum.stackexchange.com/questions/101955/trying-to-make-sense-of-uniswap-v3-fees-feegrowthinside0lastx128-feegrowthglob

const getClaimedRewardsBySymbol = async (
  position: ClPosition,
  rewardClaims: GaugeRewardClaim[],
  rewardSymbol: string
): Promise<PositionReward> => {
  const { pool } = position

  let amount = new Decimal(0)
  let value = new Decimal(0)

  const poolRewards = rewardClaims
    .filter((item) => {
      return item.gauge.clPool.symbol.toLowerCase() === pool.symbol.toLowerCase()
        && item.rewardToken.symbol.toLowerCase() === rewardSymbol
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
    }
    const rewardValue = Decimal(rewardAmount).mul(tokenPrice)
    value = value.add(rewardValue)
    amount = amount.add(new Decimal(rewardAmount))
  }

  return {
    asset: rewardSymbol,
    amount: amount.toString(),
    value: value.toString()
  }
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
    const { id: positionId, pool } = position

    const launchTimestamp = Number(position.transaction.timestamp) * 1000

    const claimedRewards: PositionReward[] = []
    const unclaimedRewards: PositionReward[] = []
    const rewardTokens = (await gaugeContract.getRewardTokens()) as string[]

    for(const tokenAddress of rewardTokens) {
      const earned = await gaugeContract.earned(tokenAddress, positionId) as bigint
      const rewardContract = new ethers.Contract(tokenAddress, ERC20ABI, provider);
      const rewardSymbol = await rewardContract.symbol();

      // claimed rewards
      const claimedReward = await getClaimedRewardsBySymbol(position, rewardClaims, rewardSymbol)
      claimedRewards.push(claimedReward)

      // unclaimed rewards
      if(earned > 0) {
        const exchangeTokenId = CoinGeckoTokenIdsMap[rewardSymbol.toLowerCase()]
        if(exchangeTokenId) {
          const price =  await getTokenPrice(exchangeTokenId)
          if(price > 0) {
            const decimals = Number(await rewardContract.decimals())
            const amount = new Decimal(earned.toString()).div(Math.pow(10, decimals))
            const value = amount.mul(price)

            unclaimedRewards.push({
              asset: rewardSymbol,
              amount: amount.toString(),
              value: value.toString()
            })
          }
        }
      }
    }

    const rewards = mergeRewards(claimedRewards, unclaimedRewards)
    const totalRewardsValue = rewards.reduce((acc, item) => acc + Number(item.value), 0)

    console.log('claimedReward', claimedRewards)
    console.log('unclaimedRewards', unclaimedRewards)
    console.log('rewards', rewards)

    const { depositedToken0, depositedToken1 } = position
    const exchangeToken0Id = CoinGeckoTokenIdsMap[pool.token0.symbol.toLowerCase()]
    const exchangeToken1Id = CoinGeckoTokenIdsMap[pool.token1.symbol.toLowerCase()]

    let apr = 0
    let totalDepositedValue = 0
    let deposit0Value = 0
    let deposit1Value = 0
    if(exchangeToken0Id && exchangeToken1Id) {
      const token0Price = await getTokenPrice(exchangeToken0Id)
      const token1Price = await getTokenPrice(exchangeToken1Id)
      deposit0Value = token0Price * Number(depositedToken0)
      deposit1Value = token1Price * Number(depositedToken1)
    }
    totalDepositedValue = deposit0Value + deposit1Value
    apr = calculateAPR(totalDepositedValue, totalRewardsValue, launchTimestamp)

    console.log(pool.symbol, 'APR:', apr, 'totalDepositedValue', totalDepositedValue,'totalRewardsValue', totalRewardsValue)

    if(totalDepositedValue > 0) {
      portfolioItems.push({
        ...portfolioItemFactory(),
        type: `Liquidity`,
        asset: pool.symbol,
        address: pool.id,
        depositTime: moment(launchTimestamp).format('YY/MM/DD HH:MM:SS'),
        deposit0Asset: position.pool.token0.symbol,
        deposit1Asset: position.pool.token1.symbol,
        deposit0Amount: position.depositedToken0,
        deposit1Amount: position.depositedToken1,
        deposit0Value: `${deposit0Value}`,
        deposit1Value: `${deposit1Value}`,
        reward0Asset: rewards[0].asset || '',
        reward1Asset: rewards[1].asset || '',
        reward0Amount: rewards[0].amount || '0',
        reward1Amount: rewards[1].amount || '0',
        reward0Value: rewards[0].value || '0',
        reward1Value: rewards[1].value || '0',
        apr: `${moment(launchTimestamp).format('DD MMM YYYY')} / ${apr.toString()}%`,
        link: `https://vfat.io/token?chainId=146&tokenAddress=${pool.id}`
      })
    }
  }

  return portfolioItems
}
