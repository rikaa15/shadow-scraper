import {ethers} from "ethers";
import {getClPositionMints} from "../../api/query";
import {getPositionMints} from "../../api";
import PositionsManagerABI from './PositionsManagerABI.json'
import GaugeV3ABI from '../../abi/GaugeV3.json'
import ERC20ABI from "../../abi/ERC20.json";
import {CoinGeckoTokenIdsMap, getTokenPrice} from "../../api/coingecko";
import Decimal from "decimal.js";
import {PortfolioItem, PositionReward} from "../types";
import {calculateAPR, calculateDaysDifference, portfolioItemFactory, roundToSignificantDigits} from "../helpers";
import moment from "moment/moment";

const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");

export const getVFatInfo = async (walletAddress: string) => {
  const positionMints = await getPositionMints({
    filter: {
      transaction_from: walletAddress
    }
  })

  const portfolioItems: PortfolioItem[] = []
  const posManager = new ethers.Contract('0x12e66c8f215ddd5d48d150c8f46ad0c6fb0f4406', PositionsManagerABI, provider);

  for(const mint of positionMints) {
    try {
      const { pool, position, transaction } = mint
      const { id: positionId, depositedToken0, depositedToken1 } = position

      const launchTimestamp = Number(transaction.timestamp) * 1000

      const [token0, token1, tickSpacing, tickLower, tickUpper, liquidity] = await posManager.positions(positionId) as [
        string, string, bigint, bigint, bigint, bigint
      ]

      const rewards: PositionReward[] = []

     if(liquidity > 0n) {
       // Calculate deposited value
       let apr = 0
       let totalDepositedValue = 0
       let deposit0Value = 0
       let deposit1Value = 0
       const exchangeToken0Id = CoinGeckoTokenIdsMap[pool.token0.symbol.toLowerCase()]
       const exchangeToken1Id = CoinGeckoTokenIdsMap[pool.token1.symbol.toLowerCase()]
       if(exchangeToken0Id && exchangeToken1Id) {
         const token0Price = await getTokenPrice(exchangeToken0Id)
         const token1Price = await getTokenPrice(exchangeToken1Id)
         deposit0Value = token0Price * Number(depositedToken0)
         deposit1Value = token1Price * Number(depositedToken1)
       }
       totalDepositedValue = deposit0Value + deposit1Value

       if(totalDepositedValue > 0) {
           // Calculate reward value
           const gaugeAddress = mint.pool.gaugeV2.id
           const gauge = new ethers.Contract(gaugeAddress, GaugeV3ABI, provider);

           const rewardTokens = await gauge.getRewardTokens() as string[]
           for(const rewardAddress of rewardTokens) {
             const earned = await gauge.earned(rewardAddress, positionId) as bigint
             const rewardContract = new ethers.Contract(rewardAddress, ERC20ABI, provider);

             if(earned > 0n) {
               const rewardSymbol = await rewardContract.symbol();

               let price = 0
               const symbol = rewardSymbol.toLowerCase();
               const exchangeTokenId = CoinGeckoTokenIdsMap[symbol];

               // Ignore GEMS rewards for now
               if(exchangeTokenId) {
                 price = await getTokenPrice(exchangeTokenId)
               } else if(symbol === 'xshadow') {
                 price = (await getTokenPrice('shadow-2')) / 2
               } else if(symbol !== 'gems') {
                 price = await getTokenPrice(symbol, true);
               }

               if(price > 0) {
                 const decimals = Number(await rewardContract.decimals())
                 const amount = new Decimal(earned.toString()).div(Math.pow(10, decimals))
                 const value = amount.mul(price)
                 rewards.push({
                   asset: rewardSymbol,
                   amount: amount.toString(),
                   value: value.toString()
                 })
               }
             }
           }

           const reward0 = rewards[0]
           const reward1 = rewards[1]
           const rewardsTotalValue = rewards.reduce((acc, r) => acc + Number(r.value), 0).toString()

           const currentBlockNumber = await provider.getBlockNumber()
           const portfolioItem: PortfolioItem = {
             ...portfolioItemFactory(),
             type: `Swap pool`,
             name: 'shadow',
             address: pool.id,
             depositTime: moment(launchTimestamp).format('YY/MM/DD HH:MM:SS'),
             depositAsset0: position.pool.token0.symbol,
             depositAsset1: position.pool.token1.symbol,
             depositAmount0: roundToSignificantDigits(position.depositedToken0),
             depositAmount1: roundToSignificantDigits(position.depositedToken1),
             depositValue0: roundToSignificantDigits(deposit0Value.toString()),
             depositValue1: roundToSignificantDigits(deposit1Value.toString()),
             depositValue: roundToSignificantDigits(
               (deposit0Value + deposit1Value).toString()
             ),
             rewardAsset0: reward0 ? reward0.asset : '',
             rewardAsset1: reward1 ? reward1.asset : '',
             rewardAmount0: reward0 ? roundToSignificantDigits(reward0.amount) : '',
             rewardAmount1: reward1 ? roundToSignificantDigits(reward1.amount) : '',
             rewardValue0: reward0 ? roundToSignificantDigits(reward0.value) : '',
             rewardValue1: reward1 ? roundToSignificantDigits(reward1.value): '',
             rewardValue: roundToSignificantDigits(rewardsTotalValue),
             totalDays: calculateDaysDifference(new Date(launchTimestamp), new Date(), 4),
             totalBlocks: (currentBlockNumber - Number(position.transaction.blockNumber)).toString(),
             depositLink: `https://www.shadow.so/liquidity/${pool.id}`
           }

           apr = calculateAPR(
             Number(portfolioItem.depositValue),
             Number(portfolioItem.rewardValue),
             Number(portfolioItem.totalDays)
           )
           portfolioItem.apr = roundToSignificantDigits(apr.toString())
           portfolioItems.push(portfolioItem)

         console.log('VFAT', pool.symbol, 'total deposited', totalDepositedValue, 'reward', rewardsTotalValue, 'apr', portfolioItem.apr)
       }
     }
    } catch (e) {
      // console.error('VFAT: failed to calculate rewards', e)
    }
  }

  return []
}
