import {getPendlePositions} from "../../api/pendle";
import {getBeefyInfo} from "../beefy";

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

  const totalValueUSD = pendleLPValue + pendlePTValue + beefyValue

  return {
    totalValueUSD,
    pendlePTValue,
    pendleLPValue,
    beefyValue
  }
}
