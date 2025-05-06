import { ethers } from "ethers";
import BeefyVaultABI from '../../abi/BeefyVaultV7.json'
import ERC20_ABI from '../../abi/ERC20.json'
import { getBeefyVaultByAddress } from "../../api/beefy-api";

const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");

export const calculateBeefyAPY = (
  currentPPFS: bigint,
  depositPPFS: bigint,
  depositTimestamp: string
) => {
  // Calculate growth ratio
  const growthRatio = Number(currentPPFS) / Number(depositPPFS);
  
  // Calculate days elapsed
  const depositDate = new Date(depositTimestamp);
  const currentDate = new Date();
  const daysElapsed = (currentDate.getTime() - depositDate.getTime()) / (1000 * 60 * 60 * 24);
  
  // Calculate APY using compound interest formula
  // APY = (currentValue/initialValue)^(365/days) - 1
  const apy = Math.pow(growthRatio, 365 / daysElapsed) - 1;
  
  return (apy * 100).toFixed(2);
};