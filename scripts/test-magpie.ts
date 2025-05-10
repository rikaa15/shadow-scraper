import { getMagpieInfo } from "../src/portfolio-tracker/magpie";
import { getAddress } from "ethers";

(async () => {
  try {
    const wallet = getAddress("0x40369a631aF44aFc5FB3e940f4C6d317a38fDD76");
    const result = await getMagpieInfo(wallet);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error running getSpectraInfo:", error);
  }
})();
