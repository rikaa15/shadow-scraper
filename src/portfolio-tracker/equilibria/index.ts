import { ethers } from "ethers";
import Decimal from "decimal.js";
import { PortfolioItem } from "../types";
import moment from "moment";
import {
  calculateTokenAPR,
  findPoolId,
  getTokenInfo,
  getUserDepositInfo,
} from "./equilibriaHelper";
import {
  portfolioItemFactory,
  roundToSignificantDigits,
  calculateDaysDifference,
} from "../helpers";

// Setup provider
const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");

const marketArray = [
  {
    name: "equilibria",
    address: "0x3F5EA53d1160177445B1898afbB16da111182418",
    type: "LP",
  },
];

const DEPOSIT_LINK = "https://equilibria.fi/dashboard";

const baseRewardPoolABI = [
  "function getRewardTokens() view returns (address[])",
  "function earned(address user, address rewardToken) view returns (uint256)",
  "function balanceOf(address user) view returns (uint256)",
];

async function getUnclaimedRewards(
  rewardPoolAddress: string,
  userAddress: string
) {
  // Create contract instance
  const rewardPoolContract = new ethers.Contract(
    rewardPoolAddress,
    baseRewardPoolABI,
    provider
  );

  // Get reward tokens
  const rewardTokens = await rewardPoolContract.getRewardTokens();

  // Get earned amounts for each token
  const rewards = await Promise.all(
    rewardTokens.map(async (token: string) => {
      const earned = await rewardPoolContract.earned(userAddress, token);

      const tokenInfo = await getTokenInfo(token);
      const amount = new Decimal(earned.toString()).div(
        10 ** tokenInfo.decimals
      );

      return {
        token,
        symbol: tokenInfo.symbol,
        decimals: tokenInfo.decimals,
        amount,
        raw: earned,
      };
    })
  );

  return rewards;
}

/**
 * Equilibria uses a boosted rewards system similar to Curve/Convex. Users stake LP tokens in reward pools
 * and earn both PENDLE incentives (distributed via vePENDLE voting) and underlying SY (Standardized Yield) rewards.
 * Rewards are distributed over 7-day periods. When harvested, rewards are split with 77.5% going to LPs and 22.5%
 * to protocol fees. Equilibria aggregates vePENDLE to boost rewards for all its users without requiring them to lock
 * PENDLE individually.
 */
export async function getEquilibriaInfo(userAddress: string) {
  const portfolioItems: PortfolioItem[] = [];
  const marketPromises = marketArray.map(async (market) => {
    try {
      const marketAddress = market.address;
      const { poolId, token, rewardPool } = await findPoolId(marketAddress);
      console.log(
        `For market ${marketAddress} found pool ID: ${poolId} with deposit token: ${token} and reward pool: ${rewardPool}`
      );

      // Get token info
      const depositTokenInfo = await getTokenInfo(token);

      // Create reward pool contract
      const rewardPoolContract = new ethers.Contract(
        rewardPool,
        baseRewardPoolABI,
        provider
      );

      // Get user's balance in the reward pool
      const userBalance = await rewardPoolContract.balanceOf(userAddress);

      // If user has no balance, return null
      if (userBalance === 0n) {
        return null;
      }

      const rewards = await getUnclaimedRewards(rewardPool, userAddress);

      const walletDepositInfo = await getUserDepositInfo(
        userAddress,
        marketAddress
      );

      const depositTimestamp = walletDepositInfo
        ? walletDepositInfo.depositTimestamp
        : new Date();
      
      const depositTokenAmount = walletDepositInfo
        ? String(walletDepositInfo.totalDeposited)
        : "0";
      const depositAmountUSD = walletDepositInfo
        ? String(walletDepositInfo.totalDepositedUSD)
        : "0";
      
      const depositDate = new Date(depositTimestamp);
      const totalBlocks = walletDepositInfo ? walletDepositInfo.totalBlocks : 0;
      
      // Process rewards
      const mainReward = rewards[0]; // First reward token (usually PENDLE)
      let secondaryReward = rewards[1]; // Second reward token (if exists)

      // Calculate APR for main reward
      const aprResult = await calculateTokenAPR(
        mainReward.token,
        mainReward.symbol,
        mainReward.amount,
        parseFloat(depositAmountUSD),
        depositDate
      );
      
      // Calculate secondary APR if available
      let secondaryAprResult = {
        tokenPrice: 0,
        apr: 0,
        daysSinceDeposit: aprResult.daysSinceDeposit,
      };

      if (secondaryReward) {
        secondaryAprResult = await calculateTokenAPR(
          secondaryReward.token,
          secondaryReward.symbol,
          secondaryReward.amount,
          parseFloat(depositAmountUSD), // Use USD value for consistency
          depositDate
        );
      }

      // Calculate total APR
      const totalApr =
        aprResult.apr + (secondaryAprResult ? secondaryAprResult.apr : 0);

      // Calculate reward values
      const mainRewardUsdValue = mainReward.amount.mul(aprResult.tokenPrice);
      const secondaryRewardUsdValue = secondaryReward && secondaryAprResult 
        ? secondaryReward.amount.mul(secondaryAprResult.tokenPrice)
        : new Decimal(0);
      const totalRewardValue = mainRewardUsdValue.add(secondaryRewardUsdValue);

      // Create portfolio item
      const portfolioItem: PortfolioItem = {
        ...portfolioItemFactory(),
        type: market.type,
        name: market.name,
        address: marketAddress,
        depositTime: moment(depositTimestamp).format("YY/MM/DD HH:MM:SS"),
        depositAsset0: depositTokenInfo.symbol,
        depositAsset1: "",
        depositAmount0: roundToSignificantDigits(depositTokenAmount),
        depositAmount1: "",
        depositValue0: roundToSignificantDigits(depositAmountUSD, 2),
        depositValue1: "",
        depositValue: roundToSignificantDigits(depositAmountUSD, 2),
        rewardAsset0: mainReward.symbol,
        rewardAsset1: secondaryReward ? secondaryReward.symbol : "",
        rewardAmount0: roundToSignificantDigits(mainReward.amount.toString()),
        rewardAmount1: secondaryReward
          ? roundToSignificantDigits(secondaryReward.amount.toString())
          : "",
        rewardValue0: roundToSignificantDigits(mainRewardUsdValue.toString()),
        rewardValue1: secondaryReward
          ? roundToSignificantDigits(secondaryRewardUsdValue.toString(), 2)
          : "",
        rewardValue: roundToSignificantDigits(totalRewardValue.toString()),
        totalDays: calculateDaysDifference(
          new Date(depositTimestamp),
          new Date(),
          4
        ),
        totalBlocks: `${totalBlocks}`,
        apr: roundToSignificantDigits(totalApr.toString(), 4),
        depositLink: DEPOSIT_LINK,
      };

      return portfolioItem;
    } catch (error) {
      console.error("Error getting Equilibria portfolio data:", error);
      return null;
    }
  });

  const results = await Promise.all(marketPromises);
  results.forEach((item) => {
    if (item) portfolioItems.push(item);
  });

  return portfolioItems;
}