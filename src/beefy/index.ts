import {exportArrayToCSV} from "../utils";

const { data: { clmHarvestEvents } } = require('./harvests.json')
import Decimal from 'decimal.js'

// const subgraphAPI = 'https://api.goldsky.com/api/public/project_clu2walwem1qm01w40v3yhw1f/subgraphs/beefy-clm-sonic/latest/gn'
// const subgraphQuery = `
//   {
//   clmHarvestEvents(
//     first:1000
//     where:{
//       clm_: {
//         id:"0xc46833f6217db6586fd129cc2f61361dfce4c21d"
//       }
//     }
//     orderBy: createdWith__blockNumber
//     orderDirection:desc
//   ) {
//     rewardToNativePrices
//     nativeToUSDPrice
//     createdWith { id, blockTimestamp, blockNumber }
//   }
// }
// `

interface HarvestEvent {
  rewardToNativePrices: string[]
  nativeToUSDPrice: string
  underlyingAmount0: string
  underlyingAmount1: string
  createdWith: {
    id: string
    blockNumber: string
    blockTimestamp: string
    sender: string
  }
  clm: {
    underlyingToken0: { symbol: string }
    underlyingToken1: { symbol: string }
  }
}

const exportFilename = 'export/beefy_wS-USDC.e_harvest_events.csv';

const main = async () => {
  let totalAmountUSD = new Decimal(0);
  (clmHarvestEvents as HarvestEvent[]).forEach(item => {
    if (item.rewardToNativePrices.length === 0) return

    const nativePrice = new Decimal(item.nativeToUSDPrice).div(10 ** 18)
    const rewardUSD = new Decimal(item.rewardToNativePrices[0])
      .div(10**18)
      .mul(nativePrice)
    totalAmountUSD = totalAmountUSD.add(rewardUSD)
  })
  console.log('totalAmountUSD', totalAmountUSD.toString())
  console.log('events count:', clmHarvestEvents.length)

  // const flatItems = (clmHarvestEvents as HarvestEvent[])
  //   .map(item => {
  //     const {
  //       rewardToNativePrices,
  //       nativeToUSDPrice,
  //       underlyingAmount0, underlyingAmount1,
  //       createdWith,
  //       clm: { underlyingToken0, underlyingToken1 }
  //     } = item
  //     const rewardAmount = new Decimal(rewardToNativePrices[0] || 0)
  //     const rewardTokenPrice = new Decimal(nativeToUSDPrice).div(10 ** 18);
  //     const rewardAmountUSD = rewardAmount.div(10**18).mul(rewardTokenPrice)
  //     return {
  //         [`${underlyingToken0.symbol}_reward_amount`]: rewardAmount,
  //         [`${underlyingToken0.symbol}_token_price`]: rewardTokenPrice,
  //         [`${underlyingToken0.symbol}_reward_amount_usd`]: rewardAmountUSD,
  //         [`${underlyingToken0.symbol}_total_balance`]: underlyingAmount0,
  //         [`${underlyingToken1.symbol}_total_balance`]: underlyingAmount1,
  //         blockNumber: +createdWith.blockNumber,
  //         blockTimestamp: +createdWith.blockTimestamp,
  //         txHash: createdWith.id,
  //         txSender: createdWith.sender
  //       }
  //   })
  //   .sort((a, b) => {
  //     return a.blockNumber - b.blockNumber;
  //   })
  // exportToCSV(exportFilename, flatItems)
  // console.log('File exported to '+exportFilename)
}

main()
