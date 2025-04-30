import { getSpectraInfo } from "../src/portfolio-tracker/spectra";
import { getEulerInfo } from "../src/portfolio-tracker/euler";
import { getMagpieInfo } from "../src/portfolio-tracker/magpie";
import { getAddress } from "ethers";
import { getShadowInfo } from "../src/portfolio-tracker/shadow";
import { getSiloInfo } from "../src/portfolio-tracker/silo";
import { getSwapXInfo } from "../src/portfolio-tracker/swapx";

const functionMap: Record<string, (wallet: string) => Promise<any>> = {
  spectra: getSpectraInfo,
  euler: getEulerInfo,
  magpie: getMagpieInfo,
  shadow: getShadowInfo,
  silo: getSiloInfo,
  swapx: getSwapXInfo
};

// Change here
const selectedFunction = process.argv[2] || 'euler';
const walletAddress = getAddress("0x881E625E5C30973b47ceE3a0f3Ef456012F13f7D");
//

(async () => {
  try {
    const targetFunction = functionMap[selectedFunction.toLowerCase()];
    
    if (!targetFunction) {
      throw new Error(`Invalid function name "${selectedFunction}". Choose from: ${Object.keys(functionMap).join(", ")}`);
    }

    const result = await targetFunction(walletAddress);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`Error running ${selectedFunction}:`, error);
  }
})();
