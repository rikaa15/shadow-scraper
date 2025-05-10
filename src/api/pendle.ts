import axios from "axios";

// https://api-v2.pendle.finance/core/docs#/Dashboard/DashboardController_getUserPositions
const client = axios.create({
  baseURL: "https://api-v2.pendle.finance",
})

interface PositionValue {
  valuation: number,
  balance: string
}

interface LPPositionValue extends PositionValue {
  activeBalance: string
}

export interface PendlePosition {
  marketId: string
  pt: PositionValue
  yt: PositionValue
  lp: LPPositionValue
}

export interface PendlePositionsInfo {
  chainId: number
  totalOpen: number
  totalClosed: number
  totalSy: number
  openPositions: PendlePosition[]
  closedPositions: PendlePosition[]
  syPositions: Array<{ syId: string; balance: string; }>
  updatedAt: string
}

export const getPendlePositions = async (walletAddress: string) => {
  const { data } = await client.get<{
    positions: PendlePositionsInfo[];
  }>(`/core/v1/dashboard/positions/database/${walletAddress}?filterUsd=0.1`)
  return data.positions
}
