import {exportToCSV} from "../utils";

const { data: { clPools } } = require('./events.json')
import moment from "moment";

// https://sonic.kingdomsubgraph.com/subgraphs/name/exp/graphql?query=%7B%0A++clPools%28%0A++++first%3A1%2C%0A++++where%3A%7B%0A++++++symbol%3A%22wS%2FUSDC.e%22%2C%0A++++++id%3A%220x324963c267C354c7660Ce8CA3F5f167E05649970%22%0A++++%7D%0A++%29%7B%0A++++id%0A++++createdAtTimestamp%0A++++createdAtBlockNumber%0A++++token0+%7B+symbol+%7D%0A++++token1+%7B+symbol+%7D%0A++++symbol%0A++++initialFeeTier%0A++++feeTier%0A++++feesUSD%0A++++txCount%0A++++totalValueLockedUSD%0A++++poolDayData%28%0A++++++first%3A+1000%0A++++++orderBy%3AstartOfDay%0A++++++orderDirection%3Adesc%0A++++%29%7B%0A++++++startOfDay%0A++++++liquidity%0A++++++feesUSD%0A++++++token0Price%0A++++++token1Price%0A++++++tvlUSD%0A++++++volumeToken0%0A++++++volumeToken1%0A++++++volumeUSD%0A++++++feesUSD%0A++++++txCount%0A++++++open%0A++++++high%0A++++++low%0A++++++close%0A++%09%7D%0A++%7D%0A%7D#// const subgraphQuery = `
// {
//   clPools(
//     first:1,
//     where:{
//       symbol:"wS/USDC.e",
//       id:"0x324963c267C354c7660Ce8CA3F5f167E05649970"
//     }
//   ){
//     id
//     createdAtTimestamp
//     createdAtBlockNumber
//     token0 { symbol }
//     token1 { symbol }
//     symbol
//     initialFeeTier
//     feeTier
//     feesUSD
//     txCount
//     totalValueLockedUSD
//     poolDayData(
//       first: 1000
//       orderBy:startOfDay
//       orderDirection:desc
//     ){
//       startOfDay
//       liquidity
//       feesUSD
//       token0Price
//       token1Price
//       tvlUSD
//       volumeToken0
//       volumeToken1
//       volumeUSD
//       feesUSD
//       txCount
//       open
//       high
//       low
//       close
//   \t}
//   }
// }
// `

interface VFatPoolEventDaily {
  startOfDay: number
  liquidity: string
  sqrtPrice: string
  token0Price: string
  token1Price: string
  tvlUSD: string
  volumeToken0: string
  volumeToken1: string
  volumeUSD: string
  feesUSD: string
  txCount: string
  open: string
  high: string
  low: string
  close: string
}

interface VFatPoolEvent {
  id: string
  createdAtTimestamp: string
  createdAtBlockNumber: string
  token0: { symbol: string }
  token1: { symbol: string }
  symbol: string
  initialFeeTier: string
  feeTier: string
  feesUSD: string
  txCount: string
  totalValueLockedUSD: string
  poolDayData: VFatPoolEventDaily[]
}

const exportFilename = 'export/vfat_wS-USDC.e_daily_snapshots.csv';

const main = async () => {
  const [ pool ] = (clPools as VFatPoolEvent[])
  const poolSymbol = pool.symbol
  const token0 = pool.token0.symbol
  const token1 = pool.token1.symbol
  const dailyItems = pool.poolDayData

  const flatItems = dailyItems
    .map(item => {
      return {
          timestamp: item.startOfDay,
          date: moment(item.startOfDay * 1000).format('MM/DD/YY'),
          liquidity: item.liquidity,
          sqrtPrice: item.sqrtPrice,
          feesUSD: Math.round(Number(item.feesUSD)),
          tvlUSD: Math.round(Number(item.tvlUSD)),
          txsCount: item.txCount,
          // [`${token0}_price`]: item.token0Price,
          // [`${token1}_price`]: item.token1Price,
          'pool_token0': token0,
          'pool_token1': token1,
          [`volume_${token0}`]: Math.round(Number(item.volumeToken0)),
          [`volume_${token1}`]: Math.round(Number(item.volumeToken1)),
          // volumeUSD: Math.round(Number(item.volumeUSD)),
          // open: item.open,
          // close: item.close,
          // low: item.low,
          // high: item.high,
        }
    })
    .sort((a, b) => {
      return a.timestamp - b.timestamp;
    })
  exportToCSV(exportFilename, flatItems)
  console.log('File exported to '+exportFilename)
}

main()
