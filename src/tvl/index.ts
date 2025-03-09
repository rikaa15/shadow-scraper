import {bootstrapDb} from "../db";
import {MappedClBurn, MappedClMint} from "../types";
import {getTokensPrice, CoinGeckoTokensMap} from "../api/coingecko";
import moment, { Moment } from "moment";

interface TvlEntry {
  date: string; // YYYY-MM-DD format
  token0Amount: number;
  token1Amount: number;
}

const calculateAvgTVL = (tvlHistory: TvlEntry[]) => {
  if (tvlHistory.length === 0) {
    return {
      token0Average: 0,
      token1Average: 0,
      daysCounted: 0,
    };
  }
  const totalToken0 = tvlHistory.reduce(
    (sum, entry) => sum + entry.token0Amount,
    0
  );
  const totalToken1 = tvlHistory.reduce(
    (sum, entry) => sum + entry.token1Amount,
    0
  );

  const daysCounted = tvlHistory.length;
  const token0Average = totalToken0 / daysCounted;
  const token1Average = totalToken1 / daysCounted;

  return {
    token0Average,
    token1Average,
    daysCounted,
  };
}

const calculateTvlDaily = (
  mints: MappedClMint[],
  burns: MappedClBurn[]
) => {
  const events = [
    ...mints.map(event => ({ ...event, type: 'mint' as const })),
    ...burns.map(event => ({ ...event, type: 'burn' as const })),
  ];

  events.sort((a, b) => a.timestamp - b.timestamp)

  let token0Amount = 0;
  let token1Amount = 0;
  const tvlHistory: TvlEntry[] = [];
  let currentDate = '';

  for (const event of events) {
    const eventDate = moment(event.timestamp * 1000).format('YYYY-MM-DD');
    if (currentDate && eventDate !== currentDate) {
      tvlHistory.push({
        date: currentDate,
        token0Amount,
        token1Amount,
      });
    }

    const amount0 = Number(event.amount0) || 0;
    const amount1 = Number(event.amount1) || 0;

    if (event.type === 'mint') {
      token0Amount += amount0;
      token1Amount += amount1;
    } else if (event.type === 'burn') {
      token0Amount -= amount0;
      token1Amount -= amount1;
    }
    currentDate = eventDate;
  }

  if (currentDate) {
    tvlHistory.push({
      date: currentDate,
      token0Amount,
      token1Amount,
    });
  }

  return tvlHistory;
}

const main = async () => {
  const db = bootstrapDb()

  let token0Amount = 0
  let token0AmountUsd = 0
  let token1Amount = 0
  let token1AmountUsd = 0
  let token0Symbol = ''
  let token1Symbol = ''

  const mints = db.prepare('SELECT * from mints order by blockNumber asc').all() as MappedClMint[]
  const burns = db.prepare('SELECT * from burns  order by blockNumber asc').all() as MappedClBurn[]

  const tvlHistory = calculateTvlDaily(mints, burns)
  const averageTVL = calculateAvgTVL(tvlHistory)

  for(const mint of mints) {
    token0Amount += Number(mint.amount0)
    token1Amount += Number(mint.amount1)
  }

  for(const burn of burns) {
    token0Amount -= Number(burn.amount0)
    token1Amount -= Number(burn.amount1)
  }

  if(mints.length > 0) {
    token0Symbol = mints[0].token0
    token1Symbol = mints[0].token1
  }

  const token0Coingecko = CoinGeckoTokensMap[token0Symbol]
  const token1Coingecko = CoinGeckoTokensMap[token1Symbol]
  if(token0Coingecko && token1Coingecko) {
    const prices = await getTokensPrice([
      token0Coingecko,
      token1Coingecko
    ])
    token0AmountUsd = prices[token0Coingecko].usd * token0Amount
    token1AmountUsd = prices[token1Coingecko].usd * token1Amount
  }

  console.log(`${
    token0Symbol
  } amount=${
    token0Amount
  } ($${
    token0AmountUsd
  }), ${
    token1Symbol
  } amount=${
    token1Amount
  } ($${
    token1AmountUsd
  })`)

  console.log(`Average TVL by days: ${token0Symbol}=${
    averageTVL.token0Average
  }, ${token1Symbol}=${
    averageTVL.token1Average
  }, days counted:${
    averageTVL.daysCounted
  }`)
}

main()
