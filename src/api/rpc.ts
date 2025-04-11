import {ethers} from "ethers";

const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");

export const getClosestBlockByTimestamp = async (
  targetTimestamp: number
) => {
  try {
    // Get the latest block number
    const latestBlockNumber = await provider.getBlockNumber();
    let low = 0;
    let high = latestBlockNumber;

    let closestBlock = null;
    let closestTimestampDiff = Infinity;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const block = await provider.getBlock(mid);

      if (!block) {
        console.error(`Block ${mid} not found`);
        return null;
      }

      const blockTimestamp = block.timestamp;
      const timestampDiff = Math.abs(blockTimestamp - targetTimestamp);

      // Update closest block if this one is closer
      if (timestampDiff < closestTimestampDiff) {
        closestTimestampDiff = timestampDiff;
        closestBlock = { blockNumber: mid, timestamp: blockTimestamp };
      }

      // If exact match, return immediately
      if (blockTimestamp === targetTimestamp) {
        return { blockNumber: mid, timestamp: blockTimestamp };
      }
      // Adjust search range
      else if (blockTimestamp < targetTimestamp) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const checkRange = 10; // Check ±10 blocks for better precision
    if(closestBlock) {
      for (let i = Math.max(0, closestBlock.blockNumber - checkRange); i <= Math.min(latestBlockNumber, closestBlock.blockNumber + checkRange); i++) {
        const block = await provider.getBlock(i);
        if(block) {
          const timestampDiff = Math.abs(block.timestamp - targetTimestamp);
          if (timestampDiff < closestTimestampDiff) {
            closestTimestampDiff = timestampDiff;
            closestBlock = { blockNumber: i, timestamp: block.timestamp };
          }
        }
      }
    }

    return closestBlock;
  } catch (error) {
    console.error("Error finding closest block:", error);
    return null;
  }
}
