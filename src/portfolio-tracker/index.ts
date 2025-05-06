import clipboardy from 'clipboardy';
import {getSwapXInfo} from "./swapx";
import {arrayToTSV} from "../utils";
import {getShadowInfo} from "./shadow";
import fs from "fs";
import {getWalletTransactionsInfo} from "./transactions-history";
import {getMagpieInfo} from "./magpie";
import {getSiloInfo} from "./silo";
import {getEulerInfo} from "./euler";
import {getSpectraInfo} from "./spectra";
import {getBeefyInfo} from './beefy';
import {PortfolioItem} from "./types";

// const userAddress = '0x4E430992Db6F3BdDbC6A50d1513845f087E9af4A'

const main = async () => {
  try {
    const userAddress = process.env.npm_config_useraddress || ''
    const copyToClipboard = Boolean(process.env.npm_config_copy) || false
    const exportToTsv = Boolean(process.env.npm_config_export) || false
    if(!userAddress) {
      console.log(`No userAddress set. Usage example: npm run portfolio --userAddress=0x4E430992Db6F3BdDbC6A50d1513845f087E9af4A.`)
      process.exit(1)
    }

    // let tokensInfo = await getTokensInfo(userAddress)
    // tokensInfo = await setUSDValues(tokensInfo)

    const [
      shadowInfo,
      swapXInfo,
      magpieInfo,
      siloInfo,
      eulerInfo,
      spectraInfo,
      beefyInfo
    ] = await Promise.all([
      getShadowInfo(userAddress),
      getSwapXInfo(userAddress),
      getMagpieInfo(userAddress),
      getSiloInfo(userAddress),
      getEulerInfo(userAddress),
      getSpectraInfo(userAddress),
      getBeefyInfo(userAddress)
    ])

    const exchangesTsv = arrayToTSV([
      ...shadowInfo,
      ...swapXInfo,
      ...magpieInfo,
      ...siloInfo,
      ...eulerInfo,
      ...spectraInfo,
      ...beefyInfo
    ] as PortfolioItem[])

    const txsTsv = ''
    // const txsInfo = await getWalletTransactionsInfo(userAddress)
    // const txsTsv = arrayToTSV(txsInfo)

    const tsv = exchangesTsv + '\n\n' + txsTsv

    console.log(tsv)

    if(copyToClipboard) {
      clipboardy.writeSync(tsv);
    }
    if(exportToTsv) {
      const filename = `export/portfolio_${userAddress}_${Math.round(Date.now() / 1000)}.tsv`
      fs.writeFileSync(filename, tsv, 'utf8');
      console.log(`${filename} created successfully`)
    }
  } catch (e) {
    console.error('failed to get portfolio data', (e as Error).message)
  }
}

main()
