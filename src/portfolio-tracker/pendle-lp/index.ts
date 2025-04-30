import { ethers } from "ethers";
import Decimal from "decimal.js";
import { PortfolioItem } from "../types";
import { portfolioItemFactory, roundToSignificantDigits } from "../helpers";
import moment from "moment";
import pendleMarketABI from "../../abi/PendleMarketV3.json";
import { fetchPendleMarketData, fetchPendleUserLPValuation } from "../../api/pendle";


const pendleMarketAddress = "0x3f5ea53d1160177445b1898afbb16da111182418".toLowerCase();
const routerAddress = "0x888888888889758f76e7103c6cbf23abbf58f946";
const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");

function decodeFeeRate(lnFeeRateRoot: bigint): Decimal {
    const SCALE = new Decimal("1e18");
    const lnRoot = new Decimal(lnFeeRateRoot.toString()).div(SCALE);
  
    const ln = lnRoot.pow(2);
    const feeRate = Decimal.exp(ln).minus(1);
  
    return feeRate;
  }

const getFeeRateFromMarket = async (): Promise<Decimal> => {
  const contract = new ethers.Contract(pendleMarketAddress, pendleMarketABI, provider);
  const marketState = await contract.readState(routerAddress);
  return decodeFeeRate(marketState.lnFeeRateRoot);
};

export const getPendleInfo = async (walletAddress: string): Promise<PortfolioItem[]> => {
    const { tradingVolumeUSD, liquidityUSD } = await fetchPendleMarketData(pendleMarketAddress);
    const { lpValueUSD, lpRawBalance } = await fetchPendleUserLPValuation(pendleMarketAddress, walletAddress);    
  const feeRate = await getFeeRateFromMarket();

  const userShare = lpValueUSD.div(liquidityUSD);
  const userFeesUSD = tradingVolumeUSD.mul(feeRate).mul(userShare);

  const actualFeeAPR = userFeesUSD.div(lpValueUSD).mul(365).mul(100);

  const item: PortfolioItem = {
    ...portfolioItemFactory(),
    name: "pendle-lp",
    address: pendleMarketAddress,
    depositTime: moment().format("YY/MM/DD HH:mm:ss"),
    depositAsset0: "aUSDC LP",
    depositAsset1: "",
    depositAmount0: roundToSignificantDigits(lpRawBalance.toString()),
    depositAmount1: "",
    depositValue0: roundToSignificantDigits(lpValueUSD.toString()),
    depositValue1: "",
    depositValue: roundToSignificantDigits(lpValueUSD.toString()),
    rewardAsset0: "",
    rewardAsset1: "",
    rewardAmount0: "",
    rewardAmount1: "",
    rewardValue0: "",
    rewardValue1: "",
    rewardValue: "",
    totalDays: "",
    totalBlocks: "",
    apr: roundToSignificantDigits(actualFeeAPR.toString()),
    type: "LP pool",
    depositLink: `https://app.pendle.finance/trade/pools/${pendleMarketAddress}`
  };

  return [item];
};
