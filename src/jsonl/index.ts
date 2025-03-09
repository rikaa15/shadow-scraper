import {getBurnEvents, getMintEvents} from "../api";
import {Statement} from "better-sqlite3";
import fs from "fs";
import {ClBurn, ClMint} from "../types";

export const exportToJson = (
  filename: string,
  items: any[]
) => {
  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(filename);
    for (const item of items) {
      stream.write(JSON.stringify(item) + '\n');
    }
    stream.on('error', reject);
    stream.end(resolve);
  });
}

const main = async () => {
  try {
    let mints: ClMint[] = []
    let burns: ClBurn[] = []
    let poolSymbol = 'wS/USDC.e'
    let blockNumber = 1707308 // Initial block number
    let continueLoop = true;
    const startTime = Date.now()

    console.log('Started fetching events...')

    do {
      const newMints = await getMintEvents({
        first: 1000,
        filter: {
          poolSymbol,
          blockNumber_gt: blockNumber
        }
      })
      mints.push(...newMints)
      if(newMints.length > 0) {
        blockNumber = Number(newMints[newMints.length - 1].transaction.blockNumber)
      } else {
        continueLoop = false
      }
      console.log(`[mints] blockNumber=${blockNumber}, count=${mints.length}`)
    } while(continueLoop)

    console.log(`Mints fetched, total amount: ${
      mints.length
    }, time elapsed=${
      Math.round((Date.now() - startTime) / 1000)
    } seconds`)

    blockNumber = 1707308 // Initial block number
    continueLoop = true

    do {
      const newBurns = await getBurnEvents({
        first: 1000,
        filter: {
          poolSymbol,
          blockNumber_gt: blockNumber
        }
      })
      burns.push(...newBurns)
      if(newBurns.length > 0) {
        blockNumber = Number(newBurns[newBurns.length - 1].transaction.blockNumber)
      } else {
        continueLoop = false
      }
      console.log(`[burns] blockNumber=${blockNumber}, count=${burns.length}`)
    } while(continueLoop)

    console.log(`Burns fetched, total amount=${
      burns.length
    }, time elapsed=${
      Math.round((Date.now() - startTime) / 1000)
    } seconds`)
    console.log('Started sorting events...')

    const events = [
      ...mints.map(event => ({ type: 'mint', ...event,  })),
      ...burns.map(event => ({ type: 'burn', ...event })),
    ];
    events.sort((a, b) => Number(a.transaction.blockNumber) - Number(b.transaction.blockNumber))

    console.log(`Total events count=${events.length}, time elapsed=${
      Math.round((Date.now() - startTime) / 1000)
    } seconds, started export...`)

    await exportToJson(`export/shadow_export_${Math.round(Date.now() / 1000)}.jsonl`, events)
    console.log(`Export complete, total time elapsed=${
      Math.round((Date.now() - startTime) / 1000)
    } seconds`)
  } catch (e) {
    console.log('Failed to load events', e)
  }
}

main()
