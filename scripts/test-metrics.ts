import { getEquilibriaInfo } from "../src/portfolio-tracker/equilibria";
import { getAddress } from "ethers";
import {getPortfolioMetrics} from "../src/portfolio-tracker/metrics";

(async () => {
  try {
    const data = await getPortfolioMetrics("0x62e9625bdff857fe8892fceb07ee9685812a850e")
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
})();
