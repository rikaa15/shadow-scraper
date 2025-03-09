import axios from "axios";
import {getBurnsQuery, getMintsQuery} from "./query";
import {ClBurn, ClMint} from "../types";
import {appConfig} from "../config";

const client = axios.create({
  baseURL: appConfig.shadowSubgraphUrl
})

export interface GetEventsFilter {
  poolSymbol?: string
  blockNumber_gt?: number
  blockNumber_lte?: number
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
