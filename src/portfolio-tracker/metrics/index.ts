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
  const startValue = 10000
  const currentValue = 15000

  const cagr = calculateCAGR(startValue, currentValue, 5)
  return {
    cagr
  }
}
