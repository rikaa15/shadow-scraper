import {ClBurn, ClMint, ClSwap, EventType} from "../types";
import {getBurnEvents, GetEventsParams, getMintEvents, getSwapEvents} from "../api";
import {RequestLimit} from "./index";

export const getEvents = async (
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
