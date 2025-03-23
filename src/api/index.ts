import axios from "axios";
import {getBurnsQuery, getGaugeRewardClaimsQuery, getMintsQuery, getPositionsQuery, getSwapsQuery} from "./query";
import {ClBurn, ClMint, ClPosition, ClSwap, GaugeRewardClaim} from "../types";
import {appConfig} from "../config";

const client = axios.create({
  baseURL: appConfig.shadowSubgraphUrl
})

export interface GetEventsFilter {
  poolSymbol?: string
  blockNumber_gt?: number
  blockNumber_lte?: number
  timestamp_gt?: number
  owner?: string
  liquidity_gt?: number
  transaction_from?: string
  gauge_isAlive?: boolean
}

export interface GetEventsSort {
  orderDirection?: 'asc' | 'desc'
  orderBy?: 'transaction__blockNumber'
}

export interface GetEventsParams {
  skip?: number
  first?: number
  filter?: GetEventsFilter
  sort?: GetEventsSort
}

export const getMintEvents = async (params: GetEventsParams) => {
  const { data } = await client.post<{
    data: {
      clMints: ClMint[]
    }
  }>('/', {
    query: getMintsQuery(params)
  })
  return data.data.clMints
}

export const getBurnEvents = async (params: GetEventsParams) => {
  const { data } = await client.post<{
    data: {
      clBurns: ClBurn[]
    }
  }>('/', {
    query: getBurnsQuery(params)
  })
  return data.data.clBurns
}

export const getSwapEvents = async (params: GetEventsParams) => {
  const { data } = await client.post<{
    data: {
      clSwaps: ClSwap[]
    }
  }>('/', {
    query: getSwapsQuery(params)
  })
  return data.data.clSwaps
}

export const getPositions = async (params: GetEventsParams) => {
  const { data } = await client.post<{
    data: {
      clPositions: ClPosition[]
    }
  }>('/', {
    query: getPositionsQuery(params)
  })
  return data.data.clPositions
}

export const getGaugeRewardClaims = async (params: GetEventsParams) => {
  const { data } = await client.post<{
    data: {
      gaugeRewardClaims: GaugeRewardClaim[]
    }
  }>('/', {
    query: getGaugeRewardClaimsQuery(params)
  })
  return data.data.gaugeRewardClaims
}
