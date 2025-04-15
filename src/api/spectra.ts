import axios from "axios";

interface SpectraIbt {
  address: string
}

interface SpectraValue { underlying: number, usd: number }

interface SpectraPool {
  address: string
  chainId: number
  feeRate: string
  ibtAmount: string
  ibtToPt: string
  impliedApy: number
  lastPrices: string
  liquidity: SpectraValue
  lpApy: {
    total: number
    boostedTotal: number
    details: {
      boostedRewards: any
      fees: number
      ibt: number
      pt: number
    }
  }
  lpt: {
    address: string
    balance: string
    chainId: number
    decimals: number
    supply: string
  }
  midFee: string
  outFee: string
  ptAmount: string
  ptApy: number
  ptPrice: SpectraValue
  ptToIbt: string
  spotPrice: string
  ytLeverage: number
  ytPrice: SpectraValue
}

export interface SpectraInfo {
  address: string
  chainId: number
  createdAt: number
  decimals: number
  ibt: SpectraIbt
  maturity: number
  maturityValue: SpectraValue
  multipliers: any
  name: string
  pools: SpectraPool[]
  rate: string
  symbol: string
  underlying: {
    address: string
    chainId: number
    decimals: number
    name: string
    price: {usd: number}
    usd: number
    symbol: string
  }
  yt: {
    address: string
    balance: string
    chainId: number
    decimals: number
    yield: { claimable: string }
  }
}

export const getSpectraData = async (
  walletAddress: string,
) => {
  const { data } = await axios.get<SpectraInfo[]>(`
    https://app.spectra.finance/api/v1/sonic/portfolio/${walletAddress}
  `)
  return data
}
