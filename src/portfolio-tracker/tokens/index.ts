import {PortfolioItem} from "../index";
import {ethers} from "ethers";
import Decimal from "decimal.js";
const ERC20ABI = require('../../abi/ERC20.json');

const tokenAddresses = [
  '0x29219dd400f2bf60e5a23d13be72b486d4038894', // USDC
  '0x039e2fb66102314ce7b64ce5ce3e5183bc94ad38', // wS
  '0xd3DCe716f3eF535C5Ff8d041c1A41C3bd89b97aE', // scUSD
  '0x0e0ce4d450c705f8a0b6dd9d5123e3df2787d16b', // wagmi
  '0x2d0e0814e62d80056181f5cd932274405966e4f0', // BEETS
  '0x6047828dc181963ba44974801ff68e538da5eaf9', // USDT
  '0xf1eF7d2D4C0c881cd634481e0586ed5d2871A74B', // PENDLE
  '0x3333b97138D4b086720b5aE8A7844b1345a33333', // Shadow
  '0x5050bc082FF4A74Fb6B0B04385dEfdDB114b2424', // xShadow
  '0x3333111A391cC08fa51353E9195526A70b333333', // x33
  '0xa04bc7140c26fc9bb1f36b1a604c7a5a88fb0e70', // SWPx
  '0x80eede496655fb9047dd39d9f418d5483ed600df', // ftxUSD
  '0x50c42deacd8fc9773493ed674b675be577f2634b', // WETH
]

export const getTokensInfo = async (
  userAddress: string
) => {
  const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");

  const portfolioItems = await Promise.all(
    tokenAddresses.map(async (tokenAddress) => {
      try {
        const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, provider);
        const balance = await tokenContract.balanceOf(userAddress)
        if(balance > 0) {
          const symbol = await tokenContract.symbol()
          const decimals = Number(await tokenContract.decimals())
          return {
            type: 'ERC20',
            asset: `${symbol}`,
            address: tokenAddress,
            balance: new Decimal(balance.toString())
              .div(Math.pow(10, decimals))
              .toDecimalPlaces(6)
              .toString(),
            value: '',
            price: '',
            time: '',
            link: `https://vfat.io/token?chainId=146&tokenAddress=${tokenAddress}`
          }
        } else {
          return null
        }
      } catch (e) {
        console.error(`failed to get token ${tokenAddress} info:`, e)
      }
    })
  )

  return portfolioItems
    .filter(_ => _) as PortfolioItem[]
}
