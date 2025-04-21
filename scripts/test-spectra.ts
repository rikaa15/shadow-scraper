import { getSpectraInfo } from "../src/portfolio-tracker/spectra";
import { getAddress } from "ethers";

(async () => {
  try {
    const wallet = getAddress("0x881E625E5C30973b47ceE3a0f3Ef456012F13f7D");
    const result = await getSpectraInfo(wallet);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error running getSpectraInfo:", error);
  }
})();
