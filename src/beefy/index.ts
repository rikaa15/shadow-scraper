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
//   }
// }
// `

interface HarvestEvent {
  rewardToNativePrices: string[]
  nativeToUSDPrice: string
}

const main = async () => {
  let totalRewards = new Decimal(0);
  (clmHarvestEvents as HarvestEvent[]).forEach(item => {
    if (item.rewardToNativePrices.length === 0) return
    const rewardUSD = new Decimal(item.rewardToNativePrices[0])
      .div(10**18)
    totalRewards = totalRewards.add(rewardUSD)
  })
  const nativeUSDPrice = new Decimal(clmHarvestEvents[clmHarvestEvents.length - 1].nativeToUSDPrice)
    .div(10 ** 18)
  const totalAmountUSD = totalRewards.mul(nativeUSDPrice)

  console.log('totalAmountUSD', totalAmountUSD.toString())
  console.log('events count:', clmHarvestEvents.length)
}

main()
