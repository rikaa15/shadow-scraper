import {exportToCSV} from "../utils";

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
  createdWith: {
    id: string
    blockNumber: string
    blockTimestamp: string
  }
}

const exportFilename = 'export/clmHarvestEvents.csv';

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
  //     const {rewardToNativePrices, nativeToUSDPrice, createdWith} = item
  //     const rewardAmount = new Decimal(rewardToNativePrices[0] || 0)
  //     const rewardTokenPrice = new Decimal(nativeToUSDPrice).div(10 ** 18);
  //     const rewardAmountUSD = rewardAmount.div(10**18).mul(rewardTokenPrice)
  //     return {
  //         rewardAmountUSD,
  //         rewardAmount,
  //         rewardTokenPrice,
  //         blockNumber: +createdWith.blockNumber,
  //         blockTimestamp: +createdWith.blockTimestamp,
  //         txHash: createdWith.id,
  //       }
  //   })
  //   .sort((a, b) => {
  //     return a.blockNumber - b.blockNumber;
  //   })
  // exportToCSV(exportFilename, flatItems)
  // console.log('File exported to '+exportFilename)
}

main()
