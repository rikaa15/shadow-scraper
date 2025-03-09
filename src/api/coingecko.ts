import axios from "axios";

export const CoinGeckoTokensMap = {
  'wS': 'sonic-3',
  'USDC.e': 'sonic-bridged-usdc-e-sonic'
} as Record<string, string>

interface CoinGeckoPriceResponse {
  [key: string]: {
    [key: string]: number
  }
}

// Coingecko API docs: https://www.coingecko.com/en/api/documentation
export const getTokensPrice = async (tokens: string[])=> {
  const ids = tokens.join(',')
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
  const { data } = await axios.get<CoinGeckoPriceResponse>(url)
  return data
}
