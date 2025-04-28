import { getEquilibriaInfo } from "../src/portfolio-tracker/equilibria";
import { getAddress } from "ethers";

(async () => {
  try {
    const wallet = getAddress("0x70709614BF9aD5bBAb18E2244046d48f234a1583");
    const result = await getEquilibriaInfo(wallet);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error running getEquilibriaInfo:", error);
  }
})();
