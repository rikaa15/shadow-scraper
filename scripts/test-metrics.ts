import { getEquilibriaInfo } from "../src/portfolio-tracker/equilibria";
import { getAddress } from "ethers";
import {getPortfolioMetrics} from "../src/portfolio-tracker/metrics";

(async () => {
  try {
    const data = await getPortfolioMetrics("0x4E430992Db6F3BdDbC6A50d1513845f087E9af4A")
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
})();
