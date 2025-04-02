import {getTransactions} from "../../api/sonicscan";
import {ethers} from "ethers";
import {WalletHistoryItem} from "../types";
import moment from "moment/moment";
import {getTokenPrice} from "../../api/coingecko";
import {roundToSignificantDigits} from "../helpers";

const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");

export const getWalletTransactionsInfo = async (walletAddress: string) => {
  const txns = await getTransactions({ address: walletAddress, sort: 'desc' })
  const currentSonicPrice = await getTokenPrice('sonic')

  const walletHistoryItems: WalletHistoryItem[] = [];

  for(const tx of txns) {
    const { blockNumber, timeStamp, functionName, value, input } = tx

    const [ functionNameShort ] = functionName.split('(')
    let amount = ''

    if(functionName
      && functionNameShort
      && ['mint', 'swap', 'deposit', 'execute'].includes(functionNameShort)
    ) {
      try {
        const contractInterface = new ethers.Interface([
          "function " + functionName
        ]);
        const decoded = contractInterface.decodeFunctionData(functionNameShort, input);
        const [decodedAmount] = decoded
        if(decodedAmount) {
          if(typeof decodedAmount === 'string' && decodedAmount.startsWith('0x')) {
            amount = String(parseInt(decodedAmount, 16))
          } else {
            amount = decodedAmount.toString()
          }

          // if(amount) {
          //   amount = String(Number(amount) / Math.pow(10, 18))
          // }
        }
      } catch (e) {}
    }

    const sonicBalance = await provider.getBalance(walletAddress, Number(blockNumber))

    const totalSonicValue = ethers.formatEther(sonicBalance)
    const totalUsdValue = String(Number(totalSonicValue) * currentSonicPrice)

    walletHistoryItems.push({
      time: moment(Number(timeStamp) * 1000).format('YY/MM/DD HH:MM:SS'),
      type: functionNameShort,
      amount,
      value: roundToSignificantDigits(ethers.formatEther(value)),
      totalSonicValue: roundToSignificantDigits(totalSonicValue),
      totalUsdValue: roundToSignificantDigits(totalUsdValue),
    })
  }

  return walletHistoryItems
}

