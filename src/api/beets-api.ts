import { ethers } from "ethers";
import ERC20_ABI from "../abi/ERC20.json";
import { CoinGeckoTokenIdsMap, getTokenPrice } from "./coingecko";

const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");

const GAUGE_ABI = [
  {
    stateMutability: "view",
    type: "function",
    name: "claimable_reward",
    inputs: [
      { name: "_user", type: "address" },
      { name: "_reward_token", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "claimed_reward",
    inputs: [
      { name: "_addr", type: "address" },
      { name: "_token", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "reward_count",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "reward_tokens",
    inputs: [{ name: "arg0", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "arg0", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
];

export async function getUserGaugeRewards(
  gaugeAddress: string,
  userAddress: string
) {
  const gaugeContract = new ethers.Contract(gaugeAddress, GAUGE_ABI, provider);

  const [userBalance, rewardCount] = await Promise.all([
    gaugeContract.balanceOf(userAddress),
    gaugeContract.reward_count()
  ]);

  const rewardTokenPromises = [];
  for (let i = 0; i < Number(rewardCount); i++) {
    rewardTokenPromises.push(gaugeContract.reward_tokens(i));
  }
  const rewardTokenAddresses = await Promise.all(rewardTokenPromises);

  const rewardPromises = rewardTokenAddresses.map(async (rewardTokenAddress, i) => {
    const tokenContract = new ethers.Contract(
      rewardTokenAddress,
      ERC20_ABI,
      provider
    );

    const [
      tokenSymbol,
      tokenDecimals,
      tokenName,
      claimableAmount,
      claimedAmount
    ] = await Promise.all([
      tokenContract.symbol(),
      tokenContract.decimals(),
      tokenContract.name(),
      gaugeContract.claimable_reward(userAddress, rewardTokenAddress),
      gaugeContract.claimed_reward(userAddress, rewardTokenAddress)
    ]);

    const claimableBN = BigInt(claimableAmount);
    const claimedBN = BigInt(claimedAmount);
    const totalEarned = claimableBN + claimedBN;

    const claimableFormatted = ethers.formatUnits(
      claimableAmount,
      tokenDecimals
    );
    const claimedFormatted = ethers.formatUnits(claimedAmount, tokenDecimals);
    const totalFormatted = ethers.formatUnits(totalEarned, tokenDecimals);
    
    const tokenUSDPrice = await getUnderlyingTokenUSDPrice(
      tokenSymbol.toLowerCase()
    );
    const rewardValue = +claimableFormatted * tokenUSDPrice;

    return {
      tokenAddress: rewardTokenAddress,
      name: tokenName,
      symbol: tokenSymbol,
      decimals: tokenDecimals,
      claimable: claimableFormatted,
      claimed: claimedFormatted,
      totalEarned: totalFormatted,
      claimableRaw: claimableAmount.toString(),
      claimedRaw: claimedAmount.toString(),
      tokenUSDPrice: tokenUSDPrice,
      rewardValue: rewardValue,
    };
  });

  const rewards = await Promise.all(rewardPromises);

  return {
    userBalance: ethers.formatEther(userBalance),
    rewards,
  };
}

export const getTokenReward = (token: any, totalGain: number, currentPositionValue: number): { rewardValue: number, rewardAmount: number, symbol: string} => {
  const tokenValuePercentage = token.value / currentPositionValue;
  const tokenRewardValue = totalGain * tokenValuePercentage;
  const tokenRewardAmount = tokenRewardValue / token.price
  
  return {
    rewardValue: tokenRewardValue,
    rewardAmount: tokenRewardAmount,
    symbol: token.symbol
  }
}


export const getUnderlyingTokenUSDPrice = async (symbol: string) => {
  const id = await CoinGeckoTokenIdsMap[symbol.toLowerCase()];
  return await getTokenPrice(id);
};