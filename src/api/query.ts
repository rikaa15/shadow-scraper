import {GetEventsFilter, GetEventsParams} from "./index";

const buildWhereQuery = (filter: GetEventsFilter) => {
  let where: any = {}
  let transactionWhere = {}

  if(filter.poolSymbol) {
    where = {
      ...where,
      pool_: {
        symbol: filter.poolSymbol
      }
    }
  }

  if(filter.blockNumber_gt) {
    transactionWhere = {
      ...transactionWhere,
      blockNumber_gt: filter.blockNumber_gt
    }
  }

  if(filter.blockNumber_lte) {
    transactionWhere = {
      ...transactionWhere,
      blockNumber_lte: filter.blockNumber_lte
    }
  }

  if(filter.timestamp_gt) {
    transactionWhere = {
      ...transactionWhere,
      timestamp_gt: filter.timestamp_gt
    }
  }

  if(filter.owner) {
    where = {
      ...where,
      owner: filter.owner
    }
  }

  if(typeof filter.liquidity_gt !== undefined) {
    where = {
      ...where,
      liquidity_gt: filter.liquidity_gt
    }
  }

  where = {
    ...where,
    transaction_: transactionWhere
  }

  return buildFilterQuery(where)
}

const buildFilterQuery = (filter: Object) => {
  return JSON.stringify(filter).replace(/"([^(")"]+)":/g,"$1:");
}

export const getMintsQuery = (params: GetEventsParams) => {
  const { first = 1000, skip = 0, filter = {}, sort = {} } = params

  const whereQuery = buildWhereQuery(filter)
  const orderDirection = sort.orderDirection || 'asc'
  const orderBy = sort.orderBy || 'transaction__blockNumber'

  return `{
    clMints(
      first: ${first}
      skip: ${skip}
      orderDirection: ${orderDirection},
      orderBy: ${orderBy},
      where: ${whereQuery}
    ) {
      id
      transaction {
        id
        blockNumber
        timestamp
      }
      owner
      origin
      amount0
      amount1
      amountUSD
      tickLower
      tickUpper
      logIndex
      token0 {
        id
        name
        symbol
      }
      token1 {
        id
        name
        symbol
      }
      pool {
        id
        symbol
      }
    }
  }`
}

export const getBurnsQuery = (params: GetEventsParams) => {
  const { first = 1000, skip = 0, filter = {}, sort = {} } = params

  const whereQuery = buildWhereQuery(filter)
  const orderDirection = sort.orderDirection || 'asc'
  const orderBy = sort.orderBy || 'transaction__blockNumber'

  return `{
    clBurns(
      first: ${first}
      skip: ${skip}
      orderDirection: ${orderDirection},
      orderBy: ${orderBy},
      where: ${whereQuery}
    ) {
      id
      transaction {
        id
        blockNumber
        timestamp
      }
      owner
      origin
      amount0
      amount1
      amountUSD
      tickLower
      tickUpper
      logIndex
      token0 {
        id
        name
        symbol
      }
      token1 {
        id
        name
        symbol
      }
      pool {
        id
        symbol
      }
    }
  }`
}

export const getSwapsQuery = (params: GetEventsParams) => {
  const { first = 1000, skip = 0, filter = {}, sort = {} } = params

  const whereQuery = buildWhereQuery(filter)
  const orderDirection = sort.orderDirection || 'asc'
  const orderBy = sort.orderBy || 'transaction__blockNumber'

  return `{
    clSwaps (
      first: ${first}
      orderDirection: ${orderDirection},
      orderBy: ${orderBy},
      where: ${whereQuery}
    ) {
      id
      transaction {
        id
        blockNumber
        timestamp
      }
      sender
      recipient
      origin
      amount0
      amount1
      amountUSD
      sqrtPriceX96
      tick
      logIndex
      token0 {
        id
        name
        symbol
      }
      token1 {
        id
        name
        symbol
      }
      pool {
        id
        symbol
      }
    }
  }`
}

export const getPositionsQuery = (params: GetEventsParams) => {
  const { first = 1000, skip = 0, filter = {}, sort = {} } = params

  const whereQuery = buildWhereQuery(filter)
  const orderDirection = sort.orderDirection || 'asc'
  const orderBy = sort.orderBy || 'transaction__blockNumber'

  return `{
    clPositions (
      first: ${first}
      orderDirection: ${orderDirection},
      orderBy: ${orderBy},
      where: ${whereQuery}
    ) {
      id
      feeGrowthInside0LastX128
      feeGrowthInside1LastX128
      liquidity
      tickLower { feeGrowthOutside0X128 feeGrowthOutside1X128 }
      tickUpper { feeGrowthOutside0X128 feeGrowthOutside1X128 }
      pool {
        id
        symbol
        token0 { symbol decimals }
        token1 { symbol decimals }
        feeGrowthGlobal0X128
        feeGrowthGlobal1X128
      }
      token0 { symbol decimals }
      token1 { symbol decimals }
    }
  }`
}
