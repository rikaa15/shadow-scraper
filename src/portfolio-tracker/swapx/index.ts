import { ethers } from "ethers";
import Decimal from "decimal.js";
import {PortfolioItem} from "../index";
import {CoinGeckoTokenIdsMap, getTokenPrice} from "../../api/coingecko";
const PoolsList = require('./poolsList.json');
const SwapXPoolABI = require('../../abi/SwapxGaugeV2CL.json');
const SwapXRewardsTokenABI = require('../../abi/SwapXRewardsToken.json');
const ERC20ABI = require('../../abi/ERC20.json');

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
        const reward = await poolContract.earned(userAddress);

        if(reward > 0) {
          const lpToken = await poolContract.TOKEN();
          const lpTokenContract = new ethers.Contract(lpToken, ERC20ABI, provider);
          const gaugeLPSupply = await poolContract.totalSupply();
          const totalLPSupply = await lpTokenContract.totalSupply()

          const balance = await poolContract.balanceOf(userAddress);
          const tokenAddress = await poolContract.rewardToken()
          const rewardTokenContract = new ethers.Contract(tokenAddress, SwapXRewardsTokenABI, provider);
          const symbol = await rewardTokenContract.symbol()
          const decimals = Number(await rewardTokenContract.decimals())
          const poolName = `${token0.symbol}/${token1.symbol}`
          const value = new Decimal(reward).div(Math.pow(10, decimals)).toNumber()
          let totalRewardsUSD = 0
          const exchangeTokenId = CoinGeckoTokenIdsMap[symbol.toLowerCase()]
          if(exchangeTokenId) {
            const tokenPrice = await getTokenPrice(exchangeTokenId)
            totalRewardsUSD = tokenPrice * value
          }

          let depositedTotalUSD = 0
          const depositedToken0Id = CoinGeckoTokenIdsMap[token0.symbol.toLowerCase()]
          const depositedToken1Id = CoinGeckoTokenIdsMap[token1.symbol.toLowerCase()]
          if(depositedToken0Id && depositedToken1Id) {
            const token0Price = await getTokenPrice(depositedToken0Id)
            const token1Price = await getTokenPrice(depositedToken1Id)
          }

          const portfolioItem: PortfolioItem = {
            type: `Pool Reward (SwapX ${poolName})`,
            asset: poolName,
            address: v3PoolAddress,
            balance: '1',
            price: `$${totalRewardsUSD}`,
            value: `$${new Decimal(totalRewardsUSD).toFixed()}`,
            time: '',
            apr: '',
            link: `https://vfat.io/token?chainId=146&tokenAddress=${tokenAddress}`
          }
          return portfolioItem
        }
        return null
      } catch (e) {
        return null
      }
    })
  )

  poolsWithRewards = poolsWithRewards
    .filter((item) => Boolean(item)
      && (Number(item.value.replace('$', '')) > 0)
    )

  return poolsWithRewards

}
