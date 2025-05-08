import {getPendlePositions} from "../../api/pendle";
import {getBeefyInfo} from "../beefy";
import {getEulerInfo} from "../euler";

const calculateCAGR = (
  start: number,
  end: number,
  periods: number,
) => {
  return (Math.pow((end / start), 1 / periods) - 1) * 100
}

export const getPortfolioMetrics = async (
  walletAddress: string
) => {
  let pendleLPValue = 0
  let pendlePTValue = 0
  const pendlePositions = await getPendlePositions(walletAddress)
  const sonicPositions = pendlePositions.find(item => item.chainId === 146)
  if(sonicPositions) {
    const openPositions = sonicPositions.openPositions
    pendleLPValue = openPositions.reduce((acc, cur) => acc + cur.lp.valuation, 0)
    pendlePTValue = openPositions.reduce((acc, cur) => acc + cur.pt.valuation, 0)
  }

  const beefyItems = await getBeefyInfo(walletAddress);
  const beefyValue = beefyItems.reduce((acc, item) => {
    return acc + Number(item.depositValue) + Number(item.rewardValue)
  }, 0)

  const eulerMEVUSDCe = await getEulerInfo(walletAddress, '0x196F3C7443E940911EE2Bb88e019Fd71400349D9')
  const eulerMEVUSDCeValue = eulerMEVUSDCe.reduce((acc, item) => {
    return acc + Number(item.depositValue) + Number(item.rewardValue)
  }, 0)

  const items = [
    {
      platform: 'Pendle',
      name: 'USDC (Silo-20)',
      value: pendlePTValue
    },
    {
      platform: 'Pendle',
      name: 'LP aUSDC',
      value: pendleLPValue
    },
    {
      platform: 'Beefy',
      name: 'frxUSD-scUSD',
      value: beefyValue,
      link: 'https://app.beefy.com/vault/swapx-ichi-frxusd-scusd'
    },
    {
      platform: 'Euler',
      name: 'MEV USDC.e',
      value: eulerMEVUSDCeValue,
      link: 'https://app.euler.finance/vault/0x196F3C7443E940911EE2Bb88e019Fd71400349D9?network=sonic'
    }
  ]

  const totalValueUSD = items.reduce((acc, item) => {
    return acc + item.value
  }, 0)

  console.log('totalValueUSD', totalValueUSD)

  return {
    totalValueUSD,
    items
  }
}
