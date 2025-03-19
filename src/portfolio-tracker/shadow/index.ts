// https://ethereum.stackexchange.com/questions/101955/trying-to-make-sense-of-uniswap-v3-fees-feegrowthinside0lastx128-feegrowthglob
import axios from "axios";
import Decimal from "decimal.js";
import {getPositions} from "../../api";
import {PortfolioItem} from "../index";

const client = axios.create({
  baseURL: 'https://sonic.kingdomsubgraph.com/subgraphs/name/exp'
})

// const getPositionsQuery = (params: GetPortfolioParams) => {
//   return `
//     {
//       clPositions(
//         first:10,
//         where:{
//           owner: "${params.owner}"
//           transaction_: {
//             id: "${params.transactionId}"
//           }
//         }
//         orderBy: transaction__blockNumber
//         orderDirection:desc
//       ){
//         owner
//         token0 { symbol decimals }
//         token1 { symbol decimals }
//         depositedToken0
//         depositedToken1
//         liquidity
//         pool { id feeGrowthGlobal0X128 feeGrowthGlobal1X128 }
//         feeGrowthInside0LastX128
//         feeGrowthInside1LastX128
//         tickLower { feeGrowthOutside0X128 }
//         tickUpper { feeGrowthOutside0X128 }
//         transaction { id }
//       }
//     }
//   `
// }

// export const getPositions = async (
//   params: GetPortfolioParams
// ) => {
//   const { data } = await client.post<{
//     data: {
//       clPositions: ShadowPosition[]
//     }
//   }>('/', {
//     query: getPositionsQuery(params)
//   })
//   return data.data.clPositions
// }

const calculateTokenFees = (
  feeGrowthOutside0X128Upper: string,
  feeGrowthOutside0X128Lower: string,
  liquidity: string,
  decimals: string
) => {
  const feeGrowthOutside0X128_upper = new Decimal(feeGrowthOutside0X128Upper)
  const feeGrowthOutside0X128_lower = new Decimal(feeGrowthOutside0X128Lower)

  const feeGrowthInside0 = feeGrowthOutside0X128_lower.sub(feeGrowthOutside0X128_upper)

  return (feeGrowthInside0.mul(new Decimal(liquidity)))
    .div(new Decimal(2).pow(128))
    .div(Math.pow(10, Number(decimals)))
    .toString()
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

  const portfolioItems: PortfolioItem[] = []

  for (const position of positions) {
    const {
      feeGrowthInside0LastX128,
      feeGrowthInside1LastX128,
      liquidity,
      token0,
      token1,
      pool,
      tickLower,
      tickUpper
    } = position

    const token0Fees = calculateTokenFees(tickUpper.feeGrowthOutside0X128, tickLower.feeGrowthOutside0X128, liquidity, token0.decimals)
    const token1Fees = calculateTokenFees(tickUpper.feeGrowthOutside1X128, tickLower.feeGrowthOutside1X128, liquidity, token1.decimals)

    if(+token0Fees > 0 || +token1Fees > 0) {
      portfolioItems.push({
        type: 'Shadow CL Pool',
        address: pool.id,
        name: pool.symbol,
        token0Reward: token0Fees,
        token0Symbol: token0.symbol,
        token1Reward: token1Fees,
        token1Symbol: token1.symbol,
        balance0: '0',
        balance1: '0',
      })
    }
  }

  return portfolioItems
}
