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

export const getEulerVaultHistory = async () => {
  const assetAddress = await vault.asset() as string
  const vaultName = await vault.name() as string
  const assetContract = new ethers.Contract(assetAddress, FiatTokenV2_ABI, provider);
  const assetSymbol = await assetContract.symbol() as string
  // const depositAsset0 = rewardAsset0
  const decimals = Number(await assetContract.decimals() as bigint)

  const daysCount = 7
  const startTimestamp = new Date('Feb-03-2025 11:05:40 PM UTC').valueOf()

  console.log(`Euler vault=${vaultName}`)
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
    const interestRate = await vault.interestRate({
      blockTag
    }) as bigint

    if(interestRate > 0n) {
      const SecondsPerYear = 31556952
      const NumberRay = 10 ** 27
      const interestRateStr = new Decimal(interestRate.toString())
        .mul(SecondsPerYear)
        .mul(100)
        .div(NumberRay)
        .toString()
      console.log(blockDateStr, 'interestRate', interestRateStr)
    }

    // const totalAssets = await vault.totalAssets({
    //   blockTag
    // }) as bigint
    //
    // if(totalAssets > 0n) {
    //   const shares = await vault.totalSupply({
    //     blockTag
    //   }) as bigint
    //   const currentAssets = await vault.convertToAssets(shares, {
    //     blockTag
    //   }) as bigint
    //   const accumulatedFeesAssets = totalAssets - currentAssets
    //   console.log('totalAssets - currentAssets', totalAssets - currentAssets)
    //
    //   const totalDays = calculateDaysDifference(
    //     new Date(startTimestamp),
    //     new Date(blockTimestamp * 1000),
    //     4
    //   )
    //
    //   const assets = new Decimal(totalAssets.toString())
    //     .div(10 ** decimals)
    //     .toString()
    //
    //   const fees = new Decimal(accumulatedFeesAssets.toString())
    //     .div(10 ** decimals)
    //     .toString()
    //
    //   const apr = calculateAPR(
    //     Number(roundToSignificantDigits(assets)),
    //     Number(roundToSignificantDigits(fees)),
    //     Number(roundToSignificantDigits(totalDays, 4))
    //   )
    //
    //   console.log(`Date=${
    //     blockDateStr
    //   }, apr=${
    //     apr
    //   }%, assets=${
    //     assets
    //   }${assetSymbol}, fees=${
    //     fees
    //   }${assetSymbol}, block=${
    //     block.blockNumber
    //   }, total days=${totalDays}`)
    // } else {
    //   console.log(`No shares found at ${
    //     blockDateStr
    //   }, block=${
    //     block.blockNumber
    //   }, exit`)
    //   break;
    // }
  }
}
