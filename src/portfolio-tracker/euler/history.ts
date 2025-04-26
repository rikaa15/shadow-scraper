import moment from "moment";
import {ethers} from "ethers";
import {getEulerDeposits} from "../../api/euler-subgraph";
import {getClosestBlockByTimestamp} from "../../api/rpc";
import {calculateAPR, calculateDaysDifference, roundToSignificantDigits} from "../helpers";
import Decimal from "decimal.js";
import EulerEVaultABI from '../../abi/EulerEVault.json'
import FiatTokenV2_ABI from '../../abi/FiatTokenV2_2_Euler.json'

const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");
const vaultAddress = '0x196F3C7443E940911EE2Bb88e019Fd71400349D9'
const vault = new ethers.Contract(vaultAddress, EulerEVaultABI, provider);

const SecondsPerYear = 365.2425 * 86400
const NumberRay = 10 ** 27
const CONFIG_SCALE = 10000

export const getEulerVaultHistory = async () => {
  const assetAddress = await vault.asset() as string
  const vaultName = await vault.name() as string
  const assetContract = new ethers.Contract(assetAddress, FiatTokenV2_ABI, provider);
  const assetSymbol = await assetContract.symbol() as string
  // const depositAsset0 = rewardAsset0
  const decimals = Number(await assetContract.decimals() as bigint)

  const daysCount = 30
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

    const interestRate = await vault.interestRate({ blockTag }) as bigint
    const interestFee = await vault.interestFee({ blockTag }) as bigint
    const totalBorrows = await vault.totalBorrows({ blockTag }) as bigint
    const totalAssets = await vault.totalAssets({ blockTag }) as bigint

    const perSecondRate = new Decimal(interestRate.toString())
      .div(NumberRay)

    const annualizedRate = new Decimal(
      (new Decimal(1).add(perSecondRate)).pow(SecondsPerYear)
    ).sub(new Decimal(1))

    const feePercentage = new Decimal(interestFee.toString())
      .div(CONFIG_SCALE)

    const effectiveAnnualizedRate = annualizedRate
      .mul(new Decimal(1).sub(feePercentage))

    const utilizationRate = new Decimal(totalBorrows.toString())
      .div(new Decimal(totalAssets.toString()))

    const vaultApr = effectiveAnnualizedRate.mul(utilizationRate)

    console.log(`[${
      blockDate.format('YYYY-MM-DD HH:SS')
    }] APR=${
      roundToSignificantDigits(vaultApr.mul(100).toString(), 6)
    }`)
  }
}
