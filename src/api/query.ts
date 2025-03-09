import {GetEventsFilter, GetEventsParams} from "./index";

const buildWhereQuery = (filter: GetEventsFilter) => {
  let where: any = {}

  if(filter.poolSymbol) {
    where = {
      ...where,
      pool_: {
        symbol: filter.poolSymbol
      }
    }
  }

  if(filter.blockNumber_gt) {
    where = {
      ...where,
      transaction_:{
        blockNumber_gt: filter.blockNumber_gt
      }
    }
  }

  return buildFilterQuery(where)
}

const buildFilterQuery = (filter: Object) => {
  return JSON.stringify(filter).replace(/"([^(")"]+)":/g,"$1:");
}

export const getMintsQuery = (params: GetEventsParams) => {
  const { first = 1000, skip = 0, filter = {} } = params

  const whereQuery = buildWhereQuery(filter)

  return `{
    clMints(
      first: ${first}
      skip: ${skip}
      orderDirection:asc,
      orderBy:transaction__blockNumber,
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
  const { first = 1000, skip = 0, filter = {} } = params

  const whereQuery = buildWhereQuery(filter)

  return `{
    clBurns(
      first: ${first}
      skip: ${skip}
      orderDirection:asc,
      orderBy:transaction__blockNumber,
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
