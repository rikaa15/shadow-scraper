import { ethers } from "ethers";
import fetch from "node-fetch";
import moment from "moment";
import Decimal from "decimal.js";

import { PortfolioItem } from "../types";
import { portfolioItemFactory, roundToSignificantDigits } from "../helpers";
import { fetchPendleMarketData } from "../../api/pendle";
import PendleMarketABI from "../../abi/PendleMarketV3.json";

const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");

const marketAddress = "0x3F5EA53d1160177445B1898afbB16da111182418";
const ptAddress = "0x930441Aa7Ab17654dF5663781CA0C02CC17e6643";

export const getPendlePTInfo = async (wallet: string): Promise<PortfolioItem[]> => {
  const iface = new ethers.Interface(PendleMarketABI);

  const logs = await provider.getLogs({
    address: marketAddress,
    topics: [ethers.id("Mint(address,uint256,uint256,uint256)")],
    fromBlock: 0,
    toBlock: "latest"
  });

  let matchedLog: ethers.Log | undefined;
  let netPt: bigint | undefined;
  let netSy: bigint | undefined;

  for (const log of logs) {
    try {
      const parsed = iface.parseLog(log) as ethers.LogDescription;
      const args = parsed.args;
      const user = (args[0] as string).toLowerCase();
      if (user === wallet.toLowerCase()) {
        matchedLog = log;
        netSy = BigInt(args[2].toString());
        netPt = BigInt(args[3].toString());
        break;
      }
    } catch {
      continue;
    }
  }

  if (!matchedLog || netPt === undefined || netSy === undefined) {
    return [];
  }

  const block = await provider.getBlock(matchedLog.blockNumber);
  if (!block) return [];

  const ptContract = new ethers.Contract(ptAddress, ["function expiry() view returns (uint256)"], provider);
  const ptExpiry = Number(await ptContract.expiry());

  const mintDateISO = new Date(block.timestamp * 1000).toISOString();
  const marketData = await fetchPendleMarketData(marketAddress, mintDateISO);

  const ptDiscount = marketData.ptDiscount;
  const snapshotTimestamp = Math.floor(new Date(marketData.timestamp).getTime() / 1000);

  const ptShare = Number(netPt) / (Number(netPt + netSy));
  const timeToMaturity = (ptExpiry - snapshotTimestamp) / (365 * 86400);
  const rawApy = Math.pow(1 + ptDiscount, 1 / timeToMaturity) - 1;
  const effectiveApy = rawApy * ptShare;

  const depositValue = new Decimal((Number(netPt + netSy) / 1e6).toFixed(6));

  return [
    {
      ...portfolioItemFactory(),
      name: "pendle-pt",
      address: marketAddress,
      depositTime: moment.unix(block.timestamp).format("YY/MM/DD HH:mm:ss"),
      depositAsset0: "PT",
      depositAsset1: "",
      depositAmount0: "",
      depositAmount1: "",
      depositValue0: roundToSignificantDigits(depositValue.toString()),
      depositValue1: "",
      depositValue: roundToSignificantDigits(depositValue.toString()),
      rewardAsset0: "",
      rewardAsset1: "",
      rewardAmount0: "",
      rewardAmount1: "",
      rewardValue0: "",
      rewardValue1: "",
      rewardValue: "",
      totalDays: "",
      totalBlocks: "",
      apr: roundToSignificantDigits((effectiveApy * 100).toString()),
      type: "fixed",
      depositLink: `https://app.pendle.finance/trade/pools/${marketAddress}`
    }
  ];
};
