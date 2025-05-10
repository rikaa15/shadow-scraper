import {getEulerCollateralHistory} from "../src/portfolio-tracker/euler/history-collateral";

(async () => {
  try {
    const result = await getEulerCollateralHistory();
  } catch (error) {
    console.error("Error running getEulerCollateralHistory:", error);
  }
})();
