import {getTransactions} from "../../api/sonicscan";
import {ethers} from "ethers";
import {WalletHistoryItem} from "../types";
import moment from "moment/moment";
import {getTokenPrice} from "../../api/coingecko";
import {includesSubstrings, roundToSignificantDigits} from "../helpers";

const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");

export const getWalletTransactionsInfo = async (walletAddress: string) => {
  const txns = await getTransactions({ address: walletAddress, sort: 'desc' })
  const currentSonicPrice = await getTokenPrice('sonic')

  const walletHistoryItems: WalletHistoryItem[] = [];

  for(const tx of txns) {
    const { blockNumber, timeStamp, functionName, value, input } = tx

    const [ functionNameShort ] = functionName.split('(')
    let amount = '0'

    if(functionName
      && functionNameShort
      && !functionName.includes('tuple')
      && includesSubstrings(functionNameShort.toLowerCase(), ['mint', 'swap', 'deposit', 'liquidity'])
    ) {
      try {
        const contractInterface = new ethers.Interface([
          "function " + functionName
        ]);
        const decoded = contractInterface.decodeFunctionData(functionName, input);

        let decodedAmount = ''
        if(functionNameShort === 'deposit') { // [ 10000000n ]
          decodedAmount = decoded[0].toString()
        } else if(functionNameShort === 'depositAssets') {
          decodedAmount = String(decoded[2])
        } else if(functionNameShort === 'addLiquidity') {
          decodedAmount = String(decoded[3]) // uint256 amountADesired
        }

        if(decodedAmount) {
          // console.log('functionName', functionName, 'decoded', decoded, 'decodedAmount', decodedAmount)
          if(decodedAmount.startsWith('0x')) {
            amount = String(parseInt(decodedAmount, 16))
          } else {
            amount = decodedAmount.toString()
          }
        }
      } catch (e) {}
    }

    const sonicBalance = await provider.getBalance(walletAddress, Number(blockNumber))

    const totalSonicValue = ethers.formatEther(sonicBalance)
    const totalUsdValue = String(Number(totalSonicValue) * currentSonicPrice)

    walletHistoryItems.push({
      time: moment(Number(timeStamp) * 1000).format('YY/MM/DD HH:MM:SS'),
      type: functionNameShort,
      amount: amount,
      value: roundToSignificantDigits(ethers.formatEther(value)),
      totalSonicValue: roundToSignificantDigits(totalSonicValue),
      totalUsdValue: roundToSignificantDigits(totalUsdValue),
    })
  }

  return walletHistoryItems
}

