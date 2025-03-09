export interface Transaction {
  id: string
  blockNumber: string
  timestamp: string
  from: string
  to: string
}

export interface ClPool {
  id: string
  symbol: string
}

export interface Token {
  id: string
  symbol: string
  name: string
  decimals: string
  totalSupply: string
  volume: string
  volumeUSD: string
  feesUSD: string
  txCount: string
  poolCount: string
  totalValueLocked: string
  priceUSD: string
}

export interface ClMint {
  id: string
  transaction: Transaction
  pool: ClPool
  token0: Token
  token1: Token
  owner: string
  origin: string
  amount: string
  amount0: string
  amount1: string
  amountUSD: string
  tickLower: string
  tickUpper: string
  logIndex: string
}

export interface MappedClMint {
  id: string
  txHash: string
  blockNumber: number
  timestamp: number
  pool: string
  userAddress: string
  token0: string
  token1: string
  amount0: string
  amount1: string
}

export interface ClBurn {
  id: string
  transaction: Transaction
  pool: ClPool
  token0: Token
  token1: Token
  owner: string
  origin: string
  amount: string
  amount0: string
  amount1: string
  amountUSD: string
  tickLower: string
  tickUpper: string
  logIndex: string
}

export interface MappedClBurn {
  id: string
  txHash: string
  blockNumber: number
  timestamp: number
  pool: string
  userAddress: string
  token0: string
  token1: string
  amount0: string
  amount1: string
}

