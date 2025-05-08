/**
 * Notes:
 * 1. Swap fee APR is an approximate calculation based on 24h trading volume and assumes 
 *    the user continuously held LP in their wallet (i.e., did not stake it in Penpie or Equilibria).
 * 2. Incentive APY is based on real-time emissions simulated from the current and user reward index, 
 *    accounting for boost and LP balance.
 * 3. LP balance and daysActive are derived from wallet-held LP only. LP staked in external contracts 
 *    (Penpie, Eq) is not included.
 * 4. Swap Fee daysActive is based on the first direct LP deposit that still results in non-zero balance.
 *    Incentive daysActive is based on the last LP addition (to account for boost).
 */


import { ethers } from "ethers";
import Decimal from "decimal.js";
import moment from "moment";

import { PortfolioItem } from "../types";
import { portfolioItemFactory, roundToSignificantDigits } from "../helpers";

import pendleMarketABI from "../../abi/PendleMarketV3.json";
import pendleRouterABI from "../../abi/PendleRouterV4.json";
import { getTokenPrice } from "../../api/coingecko";
import { fetchPendleMarketData, fetchPendleUserLPValuation } from "../../api/pendle";

const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");
const pendleMarketAddress = "0x3f5ea53d1160177445b1898afbb16da111182418";
const pendleTokenAddress = "0xf1ef7d2d4c0c881cd634481e0586ed5d2871a74b";
const routerAddress = "0x888888888889758f76e7103c6cbf23abbf58f946";

const decodeFeeRate = (lnFeeRateRoot: bigint): Decimal => {
  const SCALE = new Decimal("1e18");
  const lnRoot = new Decimal(lnFeeRateRoot.toString()).div(SCALE);
  const ln = lnRoot.pow(2);
  return Decimal.exp(ln).minus(1);
};

const getFeeAPR = (
  tradingVolumeUSD: Decimal,
  liquidityUSD: Decimal,
  lpValueUSD: Decimal,
  feeRate: Decimal
): Decimal => {
  const userShare = lpValueUSD.div(liquidityUSD);
  const dailyFees = tradingVolumeUSD.mul(feeRate).mul(userShare);
  return dailyFees.div(lpValueUSD).mul(365).mul(100);
};

const getIncentiveAPY = (
  rewardAccrued: Decimal,
  tokenPrice: Decimal,
  lpValueUSD: Decimal,
  daysActive: Decimal
): { apy: Decimal; rewardValueUSD: Decimal } => {
  const rewardValueUSD = rewardAccrued.mul(tokenPrice);
  const apy = rewardValueUSD.div(lpValueUSD).mul(365).div(daysActive).mul(100);
  return { apy, rewardValueUSD };
};

const getLastManualDepositTimestamp = async (
  walletAddress: string,
  marketAddress: string
): Promise<number | null> => {
  const router = new ethers.Contract(routerAddress, pendleRouterABI, provider);

  const logs = await router.queryFilter(
    router.filters.AddLiquiditySingleToken(walletAddress, marketAddress),
    0,
    "latest"
  );

  if (!logs.length) return null;

  logs.sort((a, b) => b.blockNumber - a.blockNumber);
  const block = await provider.getBlock(logs[0].blockNumber);
  return block?.timestamp ?? null;
};

const getFirstActiveDepositTimestamp = async (
  walletAddress: string,
  marketAddress: string
): Promise<number | null> => {
  const router = new ethers.Contract(routerAddress, pendleRouterABI, provider);
  const market = new ethers.Contract(marketAddress, pendleMarketABI, provider);

  const logs = await router.queryFilter(
    router.filters.AddLiquiditySingleToken(walletAddress, marketAddress),
    0,
    "latest"
  );

  logs.sort((a, b) => a.blockNumber - b.blockNumber);
  for (const log of logs) {
    const block = await provider.getBlock(log.blockNumber);
    if (!block) continue;

    const tx = await provider.getTransaction(log.transactionHash);
    if (!tx || tx.from.toLowerCase() !== walletAddress.toLowerCase()) continue;


    const balance = await market.balanceOf(walletAddress, { blockTag: block.number });
    if (balance > 0n) return block.timestamp;
  }
  return null;
};

export const getPendleInfo = async (walletAddress: string): Promise<PortfolioItem[]> => {
  console.log(`\nWallet: ${walletAddress}`);

  const [marketData, userValuation] = await Promise.all([
    fetchPendleMarketData(pendleMarketAddress),
    fetchPendleUserLPValuation(pendleMarketAddress, walletAddress)
  ]);

  const { tradingVolumeUSD, liquidityUSD } = marketData;
  const { lpValueUSD, lpRawBalance } = userValuation;

  const market = new ethers.Contract(pendleMarketAddress, pendleMarketABI, provider);
  const marketState = await market.readState(routerAddress);
  const feeRate = decodeFeeRate(marketState.lnFeeRateRoot);

  const rewardState = await market.rewardState(pendleTokenAddress);
  const userInfo = await market.userReward(pendleTokenAddress, walletAddress);
  const lpBalance = await market.balanceOf(walletAddress);

  const globalIndex = new Decimal(rewardState.index.toString());
  const userIndex = new Decimal(userInfo.index.toString());
  const accrued = new Decimal(userInfo.accrued.toString());
  const userLP = new Decimal(lpBalance.toString());
  const rewardDelta = globalIndex.minus(userIndex).mul(userLP).div(1e18);
  const realTimeReward = accrued.add(rewardDelta);

  const rewardTokenPrice = new Decimal(await getTokenPrice("pendle"));

  const now = Math.floor(Date.now() / 1000);
  const lastDepositTimestamp = await getLastManualDepositTimestamp(walletAddress, pendleMarketAddress);
  const firstDepositTimestamp = await getFirstActiveDepositTimestamp(walletAddress, pendleMarketAddress);

  const incentiveDaysActive = lastDepositTimestamp
    ? new Decimal(now - lastDepositTimestamp).div(86400)
    : new Decimal(1);

  const feeDaysActive = firstDepositTimestamp
    ? new Decimal(now - firstDepositTimestamp).div(86400)
    : new Decimal(1);

  const { apy: incentiveAPY, rewardValueUSD } = getIncentiveAPY(
    realTimeReward.div(1e18),
    rewardTokenPrice,
    lpValueUSD,
    incentiveDaysActive
  );

  const feeAPR = getFeeAPR(tradingVolumeUSD, liquidityUSD, lpValueUSD, feeRate);
  const totalAPY = feeAPR.plus(incentiveAPY);

  console.log(`24h Trading Volume USD: ${tradingVolumeUSD.toFixed(6)}`);
  console.log(`Days Active (fees): ${feeDaysActive.toFixed(6)}`);
  console.log(`Days Active (incentives): ${incentiveDaysActive.toFixed(6)}`);
  console.log(`PENDLE Reward Accrued: ${realTimeReward.div(1e18).toFixed(6)} PENDLE`);
  console.log(`Reward Value: $${rewardValueUSD.toFixed(6)}`);
  console.log(`Incentive APY: ${incentiveAPY.toFixed(6)}%`);
  console.log(`Fee APR (24h-based): ${feeAPR.toFixed(6)}%`);
  console.log(`Total APY: ${totalAPY.toFixed(6)}%`);

  return [
    {
      ...portfolioItemFactory(),
      name: "pendle-lp",
      address: pendleMarketAddress,
      depositTime: moment.unix(firstDepositTimestamp || now).format("YY/MM/DD HH:mm:ss"),
      depositAsset0: "aUSDC LP",
      depositAsset1: "",
      depositAmount0: roundToSignificantDigits(lpRawBalance.toString()),
      depositAmount1: "",
      depositValue0: roundToSignificantDigits(lpValueUSD.toString()),
      depositValue1: "",
      depositValue: roundToSignificantDigits(lpValueUSD.toString()),
      rewardAsset0: "PENDLE",
      rewardAsset1: "",
      rewardAmount0: realTimeReward.div(1e18).toFixed(6),
      rewardAmount1: "",
      rewardValue0: rewardValueUSD.toFixed(6),
      rewardValue1: "",
      rewardValue: rewardValueUSD.toFixed(6),
      totalDays: feeDaysActive.toFixed(2),
      totalBlocks: "",
      apr: roundToSignificantDigits(totalAPY.toString()),
      type: "LP pool",
      depositLink: `https://app.pendle.finance/trade/pools/${pendleMarketAddress}`
    }
  ];
};
