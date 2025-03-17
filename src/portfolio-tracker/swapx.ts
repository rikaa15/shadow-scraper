import { ethers } from "ethers";
import Decimal from "decimal.js";
const SwapXPoolABI = require('../abi/SwapxGaugeV2CL.json');
const SwapXRewardsTokenABI = require('../abi/SwapXRewardsToken.json');

// SwapX Pool contract
// https://sonicscan.org/address/0xdce26623440b34a93e748e131577049a8d84dded#readContract
const poolAddress = '0xdce26623440b34a93e748e131577049a8d84dded'
const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");

export const getInfo = async (
  userAddress: string
) => {
  const poolContract = new ethers.Contract(poolAddress, SwapXPoolABI, provider);
  const rewardsAmount = await poolContract.earned(userAddress);
  const rewardTokenAddress = await poolContract.rewardToken()

  const rewardTokenContract = new ethers.Contract(rewardTokenAddress, SwapXRewardsTokenABI, provider);
  const rewardTokenSymbol = await rewardTokenContract.symbol()
  const decimals = Number(await rewardTokenContract.decimals())
  const rewardsAmountFormatted = new Decimal(rewardsAmount)
    .div(Math.pow(10, decimals))
    .toString()

  return {
    rewardsAmount,
    rewardsAmountFormatted,
    rewardTokenAddress,
    rewardTokenSymbol
  }
}
