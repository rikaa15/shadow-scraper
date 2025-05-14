import axios from "axios";

export const CoinGeckoTokenIdsMap: Record<string, string> = {
  'swpx': 'swapx-2',
  'usdt': 'tether',
  'usdc.e': 'sonic-bridged-usdc-e-sonic',
  'ws': 'wrapped-sonic',
  'scusd': 'rings-scusd',
  'shadow': 'shadow-2',
  'x33': 'shadow-liquid-staking-token',
  'frxusd': 'frax-usd',
  'weth': 'weth',
  'pendle': 'pendle',
  'wbtc': 'wrapped-bitcoin'
}

// hardcode values for test purposes
export const CoinGeckoRates: Record<string, number> = {
  'swapx-2': 0.1665,
  'shadow-2': 40.90,
  'shadow-liquid-staking-token': 29.60,
  'wrapped-sonic': 0.4805,
  'sonic': 0.4805,
  'sonic-bridged-usdc-e-sonic': 1,
  'rings-scusd': 1,
  'tether': 1,
  'frax-usd': 1,
  'weth': 1802.30,
  'pendle': 3.43,
  'wrapped-bitcoin': 103637.04,
}

interface CoinGeckoPriceResponse {
  [key: string]: {
    [key: string]: number
  }
}

const tokenPriceCache: Record<string, number> = {}

// Coingecko API docs: https://www.coingecko.com/en/api/documentation
export const getTokenPrices = async (tokens: string[])=> {
  const ids = tokens.join(',')
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
  const { data } = await axios.get<CoinGeckoPriceResponse>(url)
  return data
}

export const getTokenPrice = async (
  tokenId: string,
  fromCache = true
)=> {
  if(fromCache) {
    if (tokenPriceCache[tokenId]) {
      return tokenPriceCache[tokenId]
    }
    if(CoinGeckoRates[tokenId]) {
      return CoinGeckoRates[tokenId]
    }
  }
  console.log('Coingecko API: Get token price', tokenId)
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`
  const {data} = await axios.get<CoinGeckoPriceResponse>(url)
  const value = data[tokenId]['usd']

  tokenPriceCache[tokenId] = value
  return value
}

export interface CoinGeckoToken {
  id: string
  symbol: string
  name: string
}

export const getTokensList = async ()=> {
  const url = `https://api.coingecko.com/api/v3/coins/list`
  const { data } = await axios.get<CoinGeckoToken[]>(url)
  return data
}
