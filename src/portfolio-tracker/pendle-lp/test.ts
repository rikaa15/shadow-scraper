import { ethers } from "ethers";
import fetch from "node-fetch";
import PendleMarketABI from "../../abi/PendleMarketV3.json";

const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");

const chainId = 146;
const wallet = "0x57De5488856e68710093996e6dE57d83a5A539C3";
const marketAddress = "0x3F5EA53d1160177445B1898afbB16da111182418";
const ptAddress = "0x930441Aa7Ab17654dF5663781CA0C02CC17e6643";

async function getPendleMarketData(chainId: number, market: string, timestamp?: string) {
  const url = new URL(`https://api-v2.pendle.finance/core/v2/${chainId}/markets/${market}/data`);
  if (timestamp) url.searchParams.append("timestamp", timestamp);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Pendle API error: ${res.status}`);
  return await res.json();
}

async function getPTAPY() {
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
    throw new Error("No matching Mint log found");
  }

  const block = await provider.getBlock(matchedLog.blockNumber);
  if (!block) throw new Error("Block not found");

  const ptContract = new ethers.Contract(ptAddress, ["function expiry() view returns (uint256)"], provider);
  const ptExpiry = Number(await ptContract.expiry());

  const mintDateISO = new Date(block.timestamp * 1000).toISOString();
  const marketData = await getPendleMarketData(chainId, marketAddress, mintDateISO);

  const ptDiscount = marketData.ptDiscount;
  const snapshotTimestamp = Math.floor(new Date(marketData.timestamp).getTime() / 1000);

  const ptShare = Number(netPt) / (Number(netPt + netSy));
  const T = (ptExpiry - snapshotTimestamp) / (365 * 86400);
  const rawApy = Math.pow(1 + ptDiscount, 1 / T) - 1;
  const effectiveApy = rawApy * ptShare;

  console.log("APY Breakdown");
  console.log(`PT Share: ${(ptShare * 100).toFixed(2)}%`);
  console.log(`Raw PT APY (from discount): ${(rawApy * 100).toFixed(2)}%`);
  console.log(`Effective Fixed APY: ${(effectiveApy * 100).toFixed(2)}%`);
  console.log(`PT Discount (at mint): ${ptDiscount}`);
  console.log(`PT Expiry: ${new Date(ptExpiry * 1000).toLocaleString()}`);
  console.log(`Snapshot Timestamp (API): ${new Date(snapshotTimestamp * 1000).toLocaleString()}`);
  console.log(`Mint Timestamp: ${new Date(block.timestamp * 1000).toLocaleString()}`);
}

getPTAPY();
