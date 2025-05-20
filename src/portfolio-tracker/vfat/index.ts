import {ethers} from "ethers";
import {getClPositionMints} from "../../api/query";
import {getPositionMints} from "../../api";
import PositionsManagerABI from './PositionsManagerABI.json'

const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");

export const getVFatInfo = async (walletAddress: string) => {
  const positionMints = await getPositionMints({
    filter: {
      transaction_from: walletAddress
    }
  })

  const posManager = new ethers.Contract('0x12e66c8f215ddd5d48d150c8f46ad0c6fb0f4406', PositionsManagerABI, provider);

  for(const mint of positionMints) {
    try {
      const [token0, token1, tickSpacing, tickLower, tickUpper, liquidity] = await posManager.positions(mint.position.id) as [
        string, string, bigint, bigint, bigint, bigint
      ]
     if(liquidity > 0n) {
       console.log(mint.position.id, 'liquidity', liquidity)
     }
    } catch (e) {}
  }
}
