import { getEulerInfo } from "../src/portfolio-tracker/euler/index";
import { getAddress } from "ethers";

(async () => {
  try {
    const wallet = getAddress("0x82BD5fD0F73bA74f335917991519b151f7eD6E02");

    const result = await getEulerInfo(wallet);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error running getEulerInfo:", error);
  }
})();
