import { getAddress } from "ethers";
import {getEulerInfo} from "../src/portfolio-tracker/euler";

// MEV: https://app.euler.finance/vault/0x196F3C7443E940911EE2Bb88e019Fd71400349D9?network=sonic
// Re7: https://app.euler.finance/vault/0x3D9e5462A940684073EED7e4a13d19AE0Dcd13bc?network=sonic

(async () => {
  try {
    const wallet = getAddress("0x4E430992Db6F3BdDbC6A50d1513845f087E9af4A")
    const result = await getEulerInfo(wallet);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error running getBeefyInfo:", error);
  }
})();
