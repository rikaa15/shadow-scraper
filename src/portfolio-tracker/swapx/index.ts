import { ethers } from "ethers";
import Decimal from "decimal.js";
const PoolsList = require('./poolsList.json');
const SwapXPoolABI = require('../../abi/SwapxGaugeV2CL.json');
const SwapXRewardsTokenABI = require('../../abi/SwapXRewardsToken.json');

// https://sonicscan.org/address/0xdce26623440b34a93e748e131577049a8d84dded#readContract
// query: "query ConcPools...

const poolAddress = '0xdce26623440b34a93e748e131577049a8d84dded'
const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");

// https://subgraph.satsuma-prod.com/fd5b99ed1c6a/swapx--800812/swapx-big/api

export const getInfo = async (
  userAddress: string
) => {
  const v3PoolAddresses = PoolsList
    .map((info: any) => {
      const { ichiVaults } = info
      return ichiVaults.map((item: any) => {
        if(item.gauge) {
          return item.gauge.id
        } return ''
      })
    })
    .flat()
    .filter((_: any) => _);

  let poolsWithRewards = await Promise.all(
    v3PoolAddresses.map(async (v3PoolAddress: any) => {
      try {
        const poolContract = new ethers.Contract(v3PoolAddress, SwapXPoolABI, provider);
        const rewardsAmount = await poolContract.earned(userAddress);
        const rewardTokenAddress = await poolContract.rewardToken()

        if(v3PoolAddress === '0xdce26623440b34a93e748e131577049a8d84dded') {
          console.log('rewards', rewardsAmount)
        }

        const rewardTokenContract = new ethers.Contract(rewardTokenAddress, SwapXRewardsTokenABI, provider);
        const rewardTokenSymbol = await rewardTokenContract.symbol()
        const decimals = Number(await rewardTokenContract.decimals())
        const rewardsAmountFormatted = new Decimal(rewardsAmount)
          .div(Math.pow(10, decimals))
          .toString()

        return {
          poolAddress,
          rewardsAmount,
          rewardsAmountFormatted,
          rewardTokenAddress,
          rewardTokenSymbol
        }
      } catch (e) {
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
