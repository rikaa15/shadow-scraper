import {getTokenPrices} from "../api/coingecko";
import {PortfolioItem} from "./index";
import Decimal from 'decimal.js'

const CoinGeckoTokenIdsMap: Record<string, string> = {
  'swpx': 'swapx-2',
  'usdt': 'tether',
  'usdc.e': 'sonic-bridged-usdc-e-sonic',
  'ws': 'wrapped-sonic',
  'scusd': 'rings-scusd',
  'shadow': 'shadow-2',
  'x33': 'shadow-liquid-staking-token',
  'frxusd': 'frax-usd',
  'weth': 'weth'
}

export const setUSDValues = async (
  items: PortfolioItem[]
) => {
  const exchangeTokenIds = items.map(item => {
    const key = item.asset.toLowerCase()
    return CoinGeckoTokenIdsMap[key]
  }).filter(_ => _)

  const tokenPrices = await getTokenPrices(exchangeTokenIds)

  return items.map(item => {
    const key = item.asset.toLowerCase()
    const tokenId = CoinGeckoTokenIdsMap[key]
    if(tokenId) {
      const tokenPrice = tokenPrices[tokenId]
      if(tokenPrice) {
        const price = tokenPrice['usd']
        if(price) {
          const value = new Decimal(item.balance)
            .mul(price)
            .toDecimalPlaces(6)
            .toString()
          return {
            ...item,
            price: `$${price}`,
            value: `$${value}`
          }
        }
      }
    }
    return {
      ...item,
      price: '0',
      value: '0'
    }
  })
}
