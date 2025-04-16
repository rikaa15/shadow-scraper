import { PortfolioItem } from "../types";
import { ethers } from "ethers";
import Decimal from "decimal.js";
import moment from "moment";
import {
  calculateDaysDifference,
  calculateAPR,
  portfolioItemFactory,
  roundToSignificantDigits
} from "../helpers";
import { getClosestBlockByTimestamp } from "../../api/rpc";

const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");

const SpectraPoolAddress = "0x167b0951c5d3fb8ff5ab675401e369dd65817801";
const SpectraLPTokenAddress = "0x7006bfca68c46a3bf98b41d0bd5665846a99440d";

const SpectraPoolABI = require("../../abi/SpectraLP.json");
const SpectraLPTokenABI = require("../../abi/ERC20.json");

export const getSpectraInfo = async (walletAddress: string): Promise<PortfolioItem[]> => {
  const portfolioItems: PortfolioItem[] = [];

  const lpToken = new ethers.Contract(SpectraLPTokenAddress, SpectraLPTokenABI, provider);
  const pool = new ethers.Contract(SpectraPoolAddress, SpectraPoolABI, provider);

  const maxDaysBack = 90;
  let depositTimestamp: number | null = null;
  let startBlock: number | null = null;

  for (let i = 0; i < maxDaysBack; i++) {
    const blockMoment = moment().subtract(i + 1, "days").endOf("day");
    const timestamp = blockMoment.unix();
    const block = await getClosestBlockByTimestamp(timestamp);
    if (!block) continue;

    const balance = await lpToken.balanceOf(walletAddress, {
      blockTag: block.blockNumber
    });

    if (balance > 0n) {
      depositTimestamp = block.timestamp * 1000;
      startBlock = block.blockNumber;
      break;
    }
  }

  if (!depositTimestamp || !startBlock) {
    console.warn("⚠️ Could not find deposit time on-chain for this wallet.");
    return portfolioItems;
  }

  const [lpBalanceRaw, vpStartRaw, vpNowRaw, currentBlock] = await Promise.all([
    lpToken.balanceOf(walletAddress),
    pool.get_virtual_price({ blockTag: startBlock }),
    pool.get_virtual_price(),
    provider.getBlock("latest")
  ]);

  const decimals = 18;
  const lpBalance = new Decimal(lpBalanceRaw.toString()).div(10 ** decimals);
  const vpStart = new Decimal(vpStartRaw.toString()).div(1e18);
  const vpNow = new Decimal(vpNowRaw.toString()).div(1e18);

  const depositValue0 = lpBalance.mul(vpStart).toString();
  const currentValue = lpBalance.mul(vpNow);
  const rewardValue0 = currentValue.minus(depositValue0).toString();

  const totalDays = calculateDaysDifference(new Date(depositTimestamp), new Date(), 4);
  const apr = calculateAPR(Number(depositValue0), Number(rewardValue0), Number(totalDays));

  const portfolioItem: PortfolioItem = {
    ...portfolioItemFactory(),
    type: 'Swap pool',
    name: 'spectra',
    address: SpectraPoolAddress,
    depositTime: moment(depositTimestamp).format('YY/MM/DD HH:mm:ss'),
    depositAsset0: 'USDC.e',
    depositAsset1: '',
    depositAmount0: roundToSignificantDigits(lpBalance.toString()),
    depositAmount1: '',
    depositValue0: roundToSignificantDigits(depositValue0),
    depositValue1: '',
    depositValue: roundToSignificantDigits(depositValue0),
    rewardAsset0: 'USDC.e',
    rewardAsset1: '',
    rewardAmount0: roundToSignificantDigits(currentValue.minus(depositValue0).toString()),
    rewardAmount1: '',
    rewardValue0: roundToSignificantDigits(rewardValue0),
    rewardValue1: '',
    rewardValue: roundToSignificantDigits(rewardValue0),
    totalDays,
    totalBlocks: currentBlock?.number ? (currentBlock.number - startBlock).toString() : "0",
    depositLink: `https://sonicscan.org/address/${SpectraPoolAddress}`
  };

  portfolioItem.apr = roundToSignificantDigits(apr.toString());
  portfolioItems.push(portfolioItem);

  return portfolioItems;
};
