import {getPendlePositions} from "../../api/pendle";

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

  const totalValueUSD = pendleLPValue + pendlePTValue

  // const cagr = calculateCAGR(startValue, currentValue, 5)
  return {
    totalValueUSD,
    pendlePTValue,
    pendleLPValue
  }
}
