import {ethers} from "ethers";
import {getClPositionMints} from "../../api/query";
import {getPositionMints} from "../../api";

const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");

export const getVFatInfo = async (walletAddress: string) => {
  const positionMints = await getPositionMints({
    filter: {
      transaction_from: walletAddress
    }
  })

  console.log('positionMints', positionMints)
}
