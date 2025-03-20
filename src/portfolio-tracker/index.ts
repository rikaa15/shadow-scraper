import clipboardy from 'clipboardy';
import {getSwapXInfo} from "./swapx";
import {arrayToTSV} from "../utils";
import Decimal from "decimal.js";
import {getShadowInfo} from "./shadow";

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

    const swapXInfo = await getSwapXInfo(userAddress)
    const shadowInfo = await getShadowInfo(userAddress)

    const tsv = arrayToTSV([...swapXInfo, ...shadowInfo])
    console.log(tsv)
    if(copyToClipboard) {
      clipboardy.writeSync(tsv);
    }
  } catch (e) {
    console.error('failed to get portfolio data', e)
  }
}

main()
