import {getBurnEvents, getMintEvents} from "./api";
import {bootstrapDb, exportAllToCsv, exportDatabase, insertBurnEvents, insertMintEvents} from "./db";
import {appConfig} from "./config";

const limit = 1000

const processEvents= async (
  type: 'clMint' | 'clBurn'
) => {
  let skip = 0
  let events: any[] = []
  let totalEvents = 0

  do {
    const batchTimeStart = Date.now()
    try {
      const fetchMethod = type === 'clMint'
        ? getMintEvents
        : getBurnEvents
      events = await fetchMethod({
        first: limit,
        skip,
        filter: {
          poolSymbol: appConfig.poolSymbol
        }
      })
      skip += limit
      totalEvents += events.length

      if(events.length > 0) {
        if(type === 'clMint') {
          insertMintEvents(events)
        } else if(type === 'clBurn') {
          insertBurnEvents(events)
        }

        const first = events[0]
        const last = events[events.length - 1]
        console.log(`${type} [${
          first.transaction.blockNumber
        } - ${
          last.transaction.blockNumber
        }] ${
          +last.transaction.blockNumber - +first.transaction.blockNumber
        } blocks, ${
          events.length
        } events, ${(Date.now() - batchTimeStart)} ms`)
      }
      // break;
    } catch (e) {
      console.error('Failed to get deposit events:', e)
    }
  } while(events.length > 0)

  return {
    totalEvents
  }
}

const main = async () => {
  let timeStart = Date.now()

  const { totalEvents: totalMintEvents } = await processEvents('clMint')
  const { totalEvents: totalBurnEvents } = await processEvents('clBurn')

  await exportDatabase()
  console.log(`Export completed, path=/export, total mints=${
    totalMintEvents
  }, total burns=${
    totalBurnEvents
  } total elapsed: ${
    Math.round((Date.now() - timeStart) / 1000)
  } seconds`)
  process.exit(1)
}

bootstrapDb()
main()
// exportAllToCsv()

process.on('exit', (code) => {
  console.log('Process exited with code:', code);
});
