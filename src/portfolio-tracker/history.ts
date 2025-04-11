import {getEulerPortfolioHistory} from "./euler/history";

const walletAddress = '0x4E430992Db6F3BdDbC6A50d1513845f087E9af4A'

const main = async () => {
  const eulerHistory = await getEulerPortfolioHistory(walletAddress)
}

main().catch(error => {
  console.error(error);
})
