import * as ethers from "ethers";
import fetch from "node-fetch";

// Sonic RPC
const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");

// Merkl Distributor (Sonic)
const distributorAddress = "0xdd8072bb7bbc3cdF770D715C28580d68680c72A8";

// ABI
const abi = [
  "event RewardDistributed(address indexed distributor, address indexed recipient, address token, uint256 amount, bytes32 campaignId)"
];

// Known rewarded wallet
const wallet = "0x2859ba100294c325a7d6af2762ac50c20b163abc";

// Campaigns for USDC.e vault
const campaignIds = [
  "0x2cd6055637ec8ad652a23fa476d17b9aacb6241fc9226b1fd7031cb28c2c1804",
  "0xbf788b004ffed4647ed95ff5f472a5574e2598aa29442f5cfc596e03a94464d5"
];

async function getWsPriceUSD(): Promise<number> {
  try {
    const res = await fetch("https://merkl.angle.money/api/tokens");
    const json = await res.json();
    const token = json.tokens.find((t: any) => t.symbol === "wS" && t.chainId === 146);
    return token?.price || 1.0;
  } catch {
    return 1.0;
  }
}

async function main() {
  const iface = new ethers.Interface(abi);
  const fromBlock = 30000000;
  const toBlock = "latest";

  const paddedWallet = ethers.hexZeroPad(wallet.toLowerCase(), 32);
  const topic = iface.getEvent("RewardDistributed");

  const logs = await provider.getLogs({
    address: distributorAddress,
    topics: [topic, null, paddedWallet],
    fromBlock,
    toBlock
  });

  const wSPrice = await getWsPriceUSD();
  console.log(`✅ Fetched ${logs.length} logs for wallet ${wallet}`);
  console.log("🔍 Matching Merkl campaign IDs...\n");

  let total = 0;

  for (const log of logs) {
    const parsed = iface.parseLog(log);
    const { recipient, campaignId, amount } = parsed!.args;

    const campaign = campaignId.toLowerCase();
    const amt = Number(amount) / 1e18;

    if (campaignIds.includes(campaign)) {
      total += amt;

      console.log(`🎯 Matched campaign: ${campaign}`);
      console.log(`→ Recipient: ${recipient}`);
      console.log(`→ Reward: ${amt.toFixed(6)} wS ($${(amt * wSPrice).toFixed(2)})`);
      console.log("------------------------------------------------\n");
    }
  }

  console.log(`✅ Total matched wS: ${total.toFixed(6)} ($${(total * wSPrice).toFixed(2)})`);
}

main().catch(console.error);
