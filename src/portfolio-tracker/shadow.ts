// https://ethereum.stackexchange.com/questions/101955/trying-to-make-sense-of-uniswap-v3-fees-feegrowthinside0lastx128-feegrowthglob
import axios from "axios";
import Decimal from "decimal.js";

const client = axios.create({
  baseURL: 'https://sonic.kingdomsubgraph.com/subgraphs/name/exp'
})

const getPositionsQuery = (params: GetPortfolioParams) => {
  return `
    {
      clPositions(
        first:10,
        where:{
          owner: "${params.owner}"
          transaction_: {
            id: "${params.transactionId}"
          }
        }
        orderBy: transaction__blockNumber
        orderDirection:desc
      ){
        owner
        token0 { symbol decimals }
        token1 { symbol decimals }
        depositedToken0
        depositedToken1
        liquidity
        pool { id feeGrowthGlobal0X128 feeGrowthGlobal1X128 }
        feeGrowthInside0LastX128
        feeGrowthInside1LastX128
        tickLower { feeGrowthOutside0X128 }
        tickUpper { feeGrowthOutside0X128 }
        transaction { id }
      }
    }
  `
}

interface ShadowPosition {
  "owner": string
  "token0": {
    "symbol": string
    "decimals": string
  },
  "token1": {
    "symbol": string
    "decimals": string
  },
  "depositedToken0": string
  "depositedToken1": string
  "liquidity": string
  "pool": {
    "id": string
    "feeGrowthGlobal0X128": string
    "feeGrowthGlobal1X128": string
  },
  "feeGrowthInside0LastX128": string
  "feeGrowthInside1LastX128": string
  "tickLower": {
    "feeGrowthOutside0X128": string
  },
  "tickUpper": {
    "feeGrowthOutside0X128": string
  },
  "transaction": {
    "id": string
  }
}

export const getPositions = async (
  params: GetPortfolioParams
) => {
  const { data } = await client.post<{
    data: {
      clPositions: ShadowPosition[]
    }
  }>('/', {
    query: getPositionsQuery(params)
  })
  return data.data.clPositions
}

export interface GetPortfolioParams {
  owner: string
  transactionId: string
}

export const getData = async (params: GetPortfolioParams) => {
  const positions = await getPositions(params)

  let totalFees0 = 0
  let totalFees1 = 0

  for (const position of positions) {
    const {
      feeGrowthInside0LastX128,
      feeGrowthInside1LastX128,
      liquidity,
      token0: { decimals },
      pool: { feeGrowthGlobal0X128, feeGrowthGlobal1X128 },
      tickLower: { feeGrowthOutside0X128: feeGrowthOutside0X128_lower },
      tickUpper: { feeGrowthOutside0X128: feeGrowthOutside0X128_upper }
    } = position

    const feesToken0 = +liquidity * (+feeGrowthGlobal0X128 - +feeGrowthInside0LastX128) / 2^128
    const feesToken1 = +liquidity * (+feeGrowthGlobal1X128 - +feeGrowthInside1LastX128) / 2^128
    console.log('feesToken0', feesToken0.toString(), 'feesToken1', feesToken1)

    totalFees0 += feesToken0
    totalFees1 += feesToken1
  }

  return {
    totalFees0,
    totalFees1
  }
}
