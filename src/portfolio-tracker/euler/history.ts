import moment from "moment";
import {ethers} from "ethers";
import {getEulerDeposits} from "../../api/euler-subgraph";
import {getClosestBlockByTimestamp} from "../../api/rpc";
import {calculateAPR, calculateDaysDifference, roundToSignificantDigits} from "../helpers";
import Decimal from "decimal.js";
const EulerEVaultABI = require('../../abi/EulerEVault.json');
const FiatTokenV2_ABI = require('../../abi/FiatTokenV2_2_Euler.json');

const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");
const vaultAddress = '0x196F3C7443E940911EE2Bb88e019Fd71400349D9'
const vault = new ethers.Contract(vaultAddress, EulerEVaultABI, provider);

export const getEulerPortfolioHistory = async (
  walletAddress: string
) => {
  const assetAddress = await vault.asset() as string
  const assetContract = new ethers.Contract(assetAddress, FiatTokenV2_ABI, provider);
  // const rewardAsset0 = await assetContract.symbol() as string
  // const depositAsset0 = rewardAsset0
  const decimals = Number(await assetContract.decimals() as bigint)

  // Get deposits info
  const deposits = await getEulerDeposits(walletAddress)
  const firstDeposit = deposits[deposits.length - 1]
  let totalDepositAmount = deposits.reduce((acc, item) => {
    return acc + Number(item.assets) / Math.pow(10, decimals)
  }, 0)
  const depositAmount = String(totalDepositAmount)
  const depositValue = depositAmount
  const depositTimestamp = firstDeposit
    ? Number(firstDeposit.blockTimestamp) * 1000
    : 0

  const daysCount = 7

  for(let i = 0; i < daysCount; i++) {
    const blockDate = moment().subtract(i + 1, "days").endOf('day')
    const blockTimestamp = blockDate.unix()
    const blockDateStr = blockDate.format('YYYY-MM-DD HH:mm:ss')
    // console.log(`Searching for the block for date=${blockDateStr}...`)

    const block = await getClosestBlockByTimestamp(
      blockTimestamp
    )

    if(!block) {
      console.log(`No block for timestamp=${blockTimestamp}, stop`)
      break
    }

    const blockTag = block.blockNumber
    const sharesBalance = await vault.balanceOf(walletAddress, {
      blockTag
    }) as bigint
    const assetsAmount = await vault.convertToAssets(sharesBalance, {
      blockTag
    }) as bigint

    if(assetsAmount > 0n) {
      const rewardAmount = new Decimal(assetsAmount.toString()).div(10 ** decimals)
        .sub(new Decimal(depositAmount))
        .toString()
      const rewardValue = rewardAmount // USDC.e
      const totalDays = calculateDaysDifference(
        new Date(depositTimestamp),
        new Date(),
        4
      )

      const apr = calculateAPR(
        Number(roundToSignificantDigits(depositValue)),
        Number(roundToSignificantDigits(rewardValue)),
        Number(roundToSignificantDigits(totalDays, 4))
      )

      console.log(`Date=${
        blockDateStr
      }, block=${
        block.blockNumber
      } apr=${
        apr
      }%, shares=${
        sharesBalance
      }, assets=${
        assetsAmount
      }`)
    } else {
      console.log(`No shares found at ${
        blockDateStr
      }, block=${
        block.blockNumber
      }, exit`)
      break;
    }
  }
}
