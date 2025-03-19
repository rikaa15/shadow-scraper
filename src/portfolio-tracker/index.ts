import clipboardy from 'clipboardy';
import {getInfo} from "./swapx";
import {arrayToTSV} from "../utils";

// const userAddress = '0x4E430992Db6F3BdDbC6A50d1513845f087E9af4A'

export interface PortfolioItem {
  type: string
  address: string
  name: string
  balance: string
  reward: string
  rewardToken: string
  rewardSymbol: string
}

const main = async () => {
  try {
    // const shadowData = await getData({
    //   owner: '0x4E430992Db6F3BdDbC6A50d1513845f087E9af4A',
    //   transactionId: "0x8a84f5724c8a3bbd5996ee95b81d19d1350ddc6f3362e126a12df5bf41d6302c"
    // })

    const userAddress = process.env.npm_config_useraddress || ''
    const copyToClipboard = Boolean(process.env.npm_config_copy) || false
    if(!userAddress) {
      console.log(`No userAddress set. Usage example: npm run portfolio --userAddress=0x4E430992Db6F3BdDbC6A50d1513845f087E9af4A.`)
      process.exit(1)
    }

    const swapXPools = await getInfo(userAddress)
    const tsv = arrayToTSV(swapXPools)
    console.log(tsv)
    if(copyToClipboard) {
      clipboardy.writeSync(tsv);
    }
  } catch (e) {
    console.error('failed to get portfolio data', e)
  }
}

main()
