import {getEulerVaultHistory} from "./euler/history";
import {getEulerPortfolioHistory} from "./euler/history-wallet";

const walletAddress = '0x4E430992Db6F3BdDbC6A50d1513845f087E9af4A'

const main = async () => {
  await getEulerVaultHistory()
}

main().catch(error => {
  console.error(error);
})
