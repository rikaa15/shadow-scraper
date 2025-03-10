import {getBurnEvents, GetEventsParams, getMintEvents, getSwapEvents} from "../api";
import {ClBurn, ClMint, ClSwap, EventType} from "../types";
import {exportToJson} from "../utils";

// Subgraph limitation
const RequestLimit = 1000

const getEvents = async (
  type: EventType,
  params: GetEventsParams
) => {
  const events: ClMint[] | ClBurn[] | ClSwap[] = [];
  let continueLoop = true
  let blockNumberFrom = params.filter!.blockNumber_gt

  do {
    const requestParams = {
      ...params,
      filter: {
        ...params.filter,
        blockNumber_gt: blockNumberFrom
      }
    }
    const newEvents = type === 'mint'
      ? await getMintEvents(requestParams)
      : type === 'burn'
        ? await getBurnEvents(requestParams)
        : await getSwapEvents(requestParams)

    // @ts-ignore
    events.push(...newEvents)

    if(newEvents.length === RequestLimit) {
      blockNumberFrom = Number(newEvents[newEvents.length - 1].transaction.blockNumber)
    } else {
      continueLoop = false
    }
    console.log(`[${type}] blockNumberFrom=${blockNumberFrom}, ${type} total=${events.length}`)
  } while(continueLoop)

  return events
}

const main = async () => {
  try {
    // Filter by specific pool symbol. Example: 'wS/USDC.e'
    const poolSymbol = ''
    let blockNumberFrom = 0
    let blockNumberTo = 0

    if(blockNumberTo === 0) {
      const [latestMintEvent] = await getMintEvents({
        first: 1,
        sort: {
          orderDirection: 'desc',
          orderBy: 'transaction__blockNumber'
        }
      })
      if(!latestMintEvent) {
        console.error('Latest mint event not found, exit')
        process.exit(1)
      }
      blockNumberTo = Number(latestMintEvent.transaction.blockNumber)
    }

    console.log(`Started fetching events, blockNumberFrom=${blockNumberFrom}, blockNumberTo=${blockNumberTo}...`)

    const startTime = Date.now()
    const requestParams = {
      first: RequestLimit,
      filter: {
        poolSymbol,
        blockNumber_gt: blockNumberFrom,
        blockNumber_lte: blockNumberTo
      }
    }
    const [
      mints = [],
      burns = [],
      swaps = []
    ] = await Promise.all([
      getEvents('mint', requestParams),
      getEvents('burn', requestParams),
      // getEvents('swap', requestParams),
    ])

    const events = [
      ...mints.map(event => ({ type: 'mint', ...event,  })),
      ...burns.map(event => ({ type: 'burn', ...event })),
      // ...swaps.map(event => ({ type: 'swap', ...event,  })),
    ];

    console.log(`Events fetched, total amount=${
      events.length
    }, mints=${
      mints.length
    }, burns=${
      burns.length
    }, swaps=${
      swaps.length
    } time elapsed=${
      Math.round((Date.now() - startTime) / 1000)
    } seconds`)

    console.log('Started sorting events...')
    events.sort((a, b) => Number(a.transaction.blockNumber) - Number(b.transaction.blockNumber))

    const exportFileName = `export/shadow_export_${Math.round(Date.now() / 1000)}.jsonl`
    console.log(`Sorting completed, started export to ${exportFileName}...`)

    await exportToJson(exportFileName, events)
    console.log(`Export complete, check path=${exportFileName}, total time elapsed=${
      Math.round((Date.now() - startTime) / 1000)
    } seconds`)
  } catch (e) {
    console.log('Failed to load events', e)
  }
}

main()
