import { getBeefyInfo } from "../src/portfolio-tracker/beefy";
import { getAddress } from "ethers";

(async () => {
  try {
    const wallet = getAddress("0x70709614BF9aD5bBAb18E2244046d48f234a1583")
    const result = await getBeefyInfo(wallet);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error running getBeefyInfo:", error);
  }
})();
