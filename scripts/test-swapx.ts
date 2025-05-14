import { getAddress } from "ethers";
import { getSwapXInfo } from "../src/portfolio-tracker/swapx";

(async () => {
  try {
    const wallet = getAddress("0x4E430992Db6F3BdDbC6A50d1513845f087E9af4A");
    const result = await getSwapXInfo(wallet)
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error running getSpectraInfo:", error);
  }
})();
