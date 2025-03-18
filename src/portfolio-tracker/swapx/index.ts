import { ethers } from "ethers";
import Decimal from "decimal.js";
const PoolsList = require('./poolsList.json');
const SwapXPoolABI = require('../../abi/SwapxGaugeV2CL.json');
const SwapXRewardsTokenABI = require('../../abi/SwapXRewardsToken.json');

// https://sonicscan.org/address/0xdce26623440b34a93e748e131577049a8d84dded#readContract
// query: "query ConcPools...

// const poolAddress = '0xdce26623440b34a93e748e131577049a8d84dded'
const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");

// https://subgraph.satsuma-prod.com/fd5b99ed1c6a/swapx--800812/swapx-big/api

export const getInfo = async (
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

  let poolsWithRewards = await Promise.all(
    v3Pools.map(async (v3Pool: any) => {
      try {
        const { address: v3PoolAddress, token0, token1 } = v3Pool
        const poolContract = new ethers.Contract(v3PoolAddress, SwapXPoolABI, provider);
        const rewardsAmount = await poolContract.earned(userAddress);
        const rewardTokenAddress = await poolContract.rewardToken()

        const rewardTokenContract = new ethers.Contract(rewardTokenAddress, SwapXRewardsTokenABI, provider);
        const rewardTokenSymbol = await rewardTokenContract.symbol()
        const decimals = Number(await rewardTokenContract.decimals())
        const rewardsAmountFormatted = new Decimal(rewardsAmount)
          .div(Math.pow(10, decimals))
          .toString()

        const poolName = `${token0.symbol}/${token1.symbol}`

        return {
          poolAddress: v3PoolAddress,
          poolName,
          rewardsAmount,
          rewardsAmountFormatted,
          rewardTokenAddress,
          rewardTokenSymbol
        }
      } catch (e) {
        // console.error("Error:", e)
        return {
          // @ts-ignore
          rewardsAmount: 0n
        }
      }
    })
  )
  // @ts-ignore
  poolsWithRewards = poolsWithRewards.filter((item: any) => item.rewardsAmount > 0n)

  return poolsWithRewards

}
