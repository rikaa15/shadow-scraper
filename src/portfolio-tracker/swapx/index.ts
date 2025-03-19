import { ethers } from "ethers";
import Decimal from "decimal.js";
import {PortfolioItem} from "../index";
const PoolsList = require('./poolsList.json');
const SwapXPoolABI = require('../../abi/SwapxGaugeV2CL.json');
const SwapXRewardsTokenABI = require('../../abi/SwapXRewardsToken.json');

// https://sonicscan.org/address/0xdce26623440b34a93e748e131577049a8d84dded#readContract
// query: "query ConcPools...

// const poolAddress = '0xdce26623440b34a93e748e131577049a8d84dded'
const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");

// https://subgraph.satsuma-prod.com/fd5b99ed1c6a/swapx--800812/swapx-big/api

export const getSwapXInfo = async (
  userAddress: string
) => {
  const v3Pools = PoolsList
    .map((info: any) => {
      const { ichiVaults, token0, token1 } = info
      return ichiVaults.map((item: any) => {
        if(item.gauge) {
          return {
            address: item.gauge.id,
            token0: token0,
            token1: token1,
          }
        } return {
          address: ''
        }
      })
    })
    .flat()
    .filter((item: any) => item.addresss !== '');

  let poolsWithRewards: PortfolioItem[] = await Promise.all(
    v3Pools.map(async (v3Pool: any) => {
      try {
        const { address: v3PoolAddress, token0, token1 } = v3Pool
        const poolContract = new ethers.Contract(v3PoolAddress, SwapXPoolABI, provider);
        const balance = await poolContract.balanceOf(userAddress);
        const reward = await poolContract.earned(userAddress);
        const rewardAddress = await poolContract.rewardToken()

        const rewardTokenContract = new ethers.Contract(rewardAddress, SwapXRewardsTokenABI, provider);
        const token0Symbol = await rewardTokenContract.symbol()
        const decimals = Number(await rewardTokenContract.decimals())
        const poolName = `${token0.symbol}/${token1.symbol}`
        const portfolioItem: PortfolioItem = {
          type: 'SwapX CL Pool',
          address: v3PoolAddress,
          name: poolName,
          balance0: new Decimal(balance).div(Math.pow(10, 18)).toFixed(),
          balance1: '0',
          token0Reward: new Decimal(reward).div(Math.pow(10, decimals)).toFixed(),
          token0Symbol,
          token1Reward: '0',
          token1Symbol: ''
        }
        return portfolioItem
      } catch (e) {
        return null
      }
    })
  )

  poolsWithRewards = poolsWithRewards
    .filter((item) => Boolean(item)
      && ((Number(item.balance0) > 0) || (Number(item.token0Reward) > 0))
    )

  return poolsWithRewards

}
