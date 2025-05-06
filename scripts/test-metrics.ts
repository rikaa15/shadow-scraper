import { getEquilibriaInfo } from "../src/portfolio-tracker/equilibria";
import { getAddress } from "ethers";
import {getPortfolioMetrics} from "../src/portfolio-tracker/metrics";

(async () => {
  try {
    const data = await getPortfolioMetrics("0x70709614BF9aD5bBAb18E2244046d48f234a1583")
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
})();
