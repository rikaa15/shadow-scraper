import { ethers } from "ethers";
import Decimal from "decimal.js";
import {CoinGeckoTokenIdsMap, getTokenPrice} from "../../api/coingecko";
import {calculateAPR, calculateDaysDifference, portfolioItemFactory, roundToSignificantDigits} from "../helpers";
import {PortfolioItem} from "../types";
import moment from "moment/moment";
import {getSwapXVaultDeposits} from "../../api";
import {getBlockAtTimestamp} from "../../api/llama";
import PoolsList from './poolsList.json'
import SwapXPoolABI from '../../abi/SwapxGaugeV2CL.json'
import SwapXRewardsTokenABI from '../../abi/SwapXRewardsToken.json'
import ICHIVaultABI from '../../abi/ICHIVault.json'

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

  let poolsWithRewards = await Promise.all(
    v3Pools.map(async (v3Pool: any) => {
      try {
        const { address: poolAddress, token0, token1 } = v3Pool
        const gaugeContract = new ethers.Contract(poolAddress, SwapXPoolABI, provider);
        const balanceOf = await gaugeContract.balanceOf(userAddress) as bigint;
        if(balanceOf === 0n) {
          return
        }

        const reward = await gaugeContract.earned(userAddress);
        const rewardAddress = await gaugeContract.rewardToken()
        const rewardTokenContract = new ethers.Contract(rewardAddress, SwapXRewardsTokenABI, provider);
        const rewardSymbol = await rewardTokenContract.symbol()
        const decimals = Number(await rewardTokenContract.decimals())
        const poolSymbol = `${token0.symbol}/${token1.symbol}`
        const token0Decimals = Number(token0.decimals)
        const token1Decimals = Number(token1.decimals)

        // Get deposit amounts
        let launchTimestamp = 0
        let launchBlockNumber = 0
        const ICHIVaultAddress = await gaugeContract.TOKEN();
        const vaultDeposits = await getSwapXVaultDeposits(userAddress, ICHIVaultAddress)

        if(vaultDeposits.length > 0){
          const timestamp = Number(vaultDeposits[0].createdAtTimestamp)
          launchTimestamp = timestamp * 1000
          try {
            launchBlockNumber = await getBlockAtTimestamp(timestamp)
          } catch (e) {
            console.error('SwapX: failed to get block number at timestamp', timestamp, e)
          }
        }

        const ICHIVaultContract = new ethers.Contract(ICHIVaultAddress, ICHIVaultABI, provider);
        const gaugeTotalSupply = await gaugeContract.totalSupply() as bigint
        const ichiTotalSupply = await ICHIVaultContract.totalSupply() as bigint
        const [ichiTotal0, ichiTotal1] = await ICHIVaultContract.getTotalAmounts() as [bigint, bigint]
        const userGaugeShare = new Decimal(balanceOf.toString())
          .div(new Decimal(gaugeTotalSupply.toString()))
        const gaugePoolShare = new Decimal(gaugeTotalSupply.toString())
          .div(new Decimal(ichiTotalSupply.toString()))
        const userPoolShare = userGaugeShare.mul(gaugePoolShare)
        const depositAmount0 = userPoolShare.mul(new Decimal(ichiTotal0.toString()))
          .div(10 ** token0Decimals)
          .toNumber()
        const depositAmount1 = userPoolShare.mul(new Decimal(ichiTotal1.toString()))
          .div(10 ** token0Decimals)
          .toNumber()

        const rewardAmount0 = new Decimal(reward).div(Math.pow(10, decimals)).toNumber()
        let depositValue0 = 0
        let depositValue1 = 0
        let rewardValue0 = 0

        // deposit value in USD
        const depositedToken0Id = CoinGeckoTokenIdsMap[token0.symbol.toLowerCase()]
        const depositedToken1Id = CoinGeckoTokenIdsMap[token1.symbol.toLowerCase()]
        if(depositedToken0Id && depositedToken1Id) {
          const token0Price = await getTokenPrice(depositedToken0Id)
          const token1Price = await getTokenPrice(depositedToken1Id)
          depositValue0 = token0Price * depositAmount0
          depositValue1 = token1Price * depositAmount1
        }

        // Reward value
        const exchangeTokenId = CoinGeckoTokenIdsMap[rewardSymbol.toLowerCase()]
        if(exchangeTokenId) {
          const token0Price = await getTokenPrice(exchangeTokenId)
          rewardValue0 = token0Price * rewardAmount0
        }

        let apr = 0

        if(depositValue0 + depositValue1 > 0) {
          const currentBlockNumber = await provider.getBlockNumber()
          const portfolioItem: PortfolioItem = {
            ...portfolioItemFactory(),
            name: 'swapx',
            type: `Swap pool`,
            address: poolAddress,
            depositTime: moment(launchTimestamp).format('YY/MM/DD HH:MM:SS'),
            depositAsset0: token0.symbol,
            depositAsset1: token1.symbol,
            depositAmount0: roundToSignificantDigits(depositAmount0.toString()),
            depositAmount1: roundToSignificantDigits(depositAmount1.toString()),
            depositValue0: roundToSignificantDigits(depositValue0.toString()),
            depositValue1: roundToSignificantDigits(depositValue1.toString()),
            depositValue: roundToSignificantDigits(
              (depositValue0 + depositValue1).toString()
            ),
            rewardAsset0: rewardSymbol,
            rewardAsset1: '',
            rewardAmount0: roundToSignificantDigits(rewardAmount0.toString()),
            rewardAmount1: '',
            rewardValue0: roundToSignificantDigits(rewardValue0.toString()),
            rewardValue1: '',
            rewardValue: roundToSignificantDigits(rewardValue0.toString()),
            totalDays: calculateDaysDifference(new Date(launchTimestamp), new Date(), 4),
            totalBlocks: (currentBlockNumber - launchBlockNumber).toString(),
            depositLink: `https://swapx.fi/earn?search=${poolSymbol}`
          }

          apr = calculateAPR(
            Number(portfolioItem.depositValue),
            Number(portfolioItem.rewardValue),
            Number(portfolioItem.totalDays)
          )
          portfolioItem.apr = roundToSignificantDigits(apr.toString())
          return portfolioItem
        }
        return null
      } catch (e) {
        return null
      }
    })
  )

  poolsWithRewards = poolsWithRewards
    .filter((item) => item && Boolean(item)
      && (Number(item.depositValue) > 0)
    )

  return poolsWithRewards

}
