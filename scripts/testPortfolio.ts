import { getSpectraInfo } from "../src/portfolio-tracker/spectra";
import { getEulerInfo } from "../src/portfolio-tracker/euler";
import { getMagpieInfo } from "../src/portfolio-tracker/magpie";
import { getAddress } from "ethers";
import { getShadowInfo } from "../src/portfolio-tracker/shadow";
import { getSiloInfo } from "../src/portfolio-tracker/silo";
import { getSwapXInfo } from "../src/portfolio-tracker/swapx";
import { getPendleLPInfo } from "../src/portfolio-tracker/pendle-lp";
import { getPendlePTInfo } from "../src/portfolio-tracker/pendle-pt";
import { getPendleInfo } from "../src/portfolio-tracker/pendle";

const functionMap: Record<string, (wallet: string) => Promise<any>> = {
  spectra: getSpectraInfo,
  euler: getEulerInfo,
  magpie: getMagpieInfo,
  shadow: getShadowInfo,
  silo: getSiloInfo,
  swapx: getSwapXInfo,
  pendlelp: getPendleLPInfo,
  pendlept: getPendlePTInfo,
  pendle: getPendleInfo,
};

// Change here
const selectedFunction = process.argv[2] || 'euler';
const walletAddress = getAddress("0x57De5488856e68710093996e6dE57d83a5A539C3");
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
