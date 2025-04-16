import { getSpectraInfo } from "../src/portfolio-tracker/spectra-lppt";
import { getAddress } from "ethers";

(async () => {
  try {
    const wallet = getAddress("0x57De5488856e68710093996e6dE57d83a5A539C3");
    const result = await getSpectraInfo(wallet);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error running getSpectraInfo:", error);
  }
})();
