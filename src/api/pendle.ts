import Decimal from "decimal.js";
import fetch from "node-fetch";

export const fetchPendleMarketData = async (
  marketAddress: string,
  timestampISO?: string
) => {
  const url = new URL(`https://api-v2.pendle.finance/core/v2/146/markets/${marketAddress}/data`);
  if (timestampISO) url.searchParams.append("timestamp", timestampISO);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch market data from Pendle API");

  const data = await res.json();
  return {
    tradingVolumeUSD: new Decimal(data.tradingVolume.usd),
    liquidityUSD: new Decimal(data.liquidity.usd),
    ptDiscount: data.ptDiscount,
    timestamp: data.timestamp,
    raw: data
  };
};


export const fetchPendleUserLPValuation = async (marketAddress: string, walletAddress: string) => {
  const url = `https://api-v2.pendle.finance/core/v1/dashboard/positions/database/${walletAddress}?filterUsd=0.1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch user position from Pendle API");
  const data = await res.json();

  const pos = data.positions[0]?.openPositions.find((p: any) =>
    p.marketId.toLowerCase().includes(marketAddress.toLowerCase())
  );
  if (!pos) throw new Error("No LP position found for user in Pendle market");

  return {
    lpValueUSD: new Decimal(pos.lp.valuation),
    lpRawBalance: new Decimal(pos.lp.balance),
  };
};
