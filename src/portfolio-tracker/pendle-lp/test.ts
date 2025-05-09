import { ethers } from "ethers";
import PendleMarketABI from "../../abi/PendleMarketV3.json";

const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");

const wallet = "0x57De5488856e68710093996e6dE57d83a5A539C3";
const marketAddress = "0x3F5EA53d1160177445B1898afbB16da111182418";
const ptExpiry = 1755129600; // Aug 14, 2025
const ptDiscount = 0.0225;   // 2.25%

async function getFirstMintEventAPY() {
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

  const timestamp = block.timestamp;
  const ptShare = Number(netPt) / (Number(netPt + netSy));
  const T = (ptExpiry - timestamp) / (365 * 86400);
  const rawApy = Math.pow(1 + ptDiscount, 1 / T) - 1;
  const effectiveApy = rawApy * ptShare;

  console.log(`PT Share: ${(ptShare * 100).toFixed(2)}%`);
  console.log(`Raw PT APY: ${(rawApy * 100).toFixed(2)}%`);
  console.log(`User PT APY: ${(effectiveApy * 100).toFixed(2)}%`);
}

getFirstMintEventAPY();
