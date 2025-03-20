import clipboardy from 'clipboardy';
import {getSwapXInfo} from "./swapx";
import {arrayToTSV} from "../utils";
import Decimal from "decimal.js";
import {getShadowInfo} from "./shadow";
import {getTokensInfo} from "./tokens";

// const userAddress = '0x4E430992Db6F3BdDbC6A50d1513845f087E9af4A'

export interface PortfolioItem {
  type: string
  address: string
  name: string
  balance: string
  rewardAmount: string
  rewardSymbol: string
}

const main = async () => {
  try {
    const userAddress = process.env.npm_config_useraddress || ''
    const copyToClipboard = Boolean(process.env.npm_config_copy) || false
    if(!userAddress) {
      console.log(`No userAddress set. Usage example: npm run portfolio --userAddress=0x4E430992Db6F3BdDbC6A50d1513845f087E9af4A.`)
      process.exit(1)
    }

    const tokensInfo = await getTokensInfo(userAddress)
    const shadowInfo = await getShadowInfo(userAddress)
    const swapXInfo = await getSwapXInfo(userAddress)

    const tsv = arrayToTSV([...tokensInfo, ...swapXInfo, ...shadowInfo])
    console.log(tsv)
    if(copyToClipboard) {
      clipboardy.writeSync(tsv);
    }
  } catch (e) {
    console.error('failed to get portfolio data', e)
  }
}

main()
