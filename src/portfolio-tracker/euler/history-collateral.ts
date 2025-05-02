import moment from "moment";
import {ethers} from "ethers";
import {getClosestBlockByTimestamp} from "../../api/rpc";
import {roundToSignificantDigits} from "../helpers";
import Decimal from "decimal.js";
import EulerEVaultABI from '../../abi/EulerEVault.json'

const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");
const vaultAddress = '0x196F3C7443E940911EE2Bb88e019Fd71400349D9'
// const vaultAddress = '0x3D9e5462A940684073EED7e4a13d19AE0Dcd13bc'
const vault = new ethers.Contract(vaultAddress, EulerEVaultABI, provider);

const SecondsPerYear = 365.2425 * 86400
const NumberRay = 10 ** 27
const CONFIG_SCALE = 10000

export const getEulerCollateralHistory = async () => {
  const vaultName = await vault.name() as string

  const daysCount = 30
  let minApr = new Decimal(1000)
  let maxApr = new Decimal(0)

  console.log(`Euler vault ${vaultName}`)
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

    const utilization = new Decimal(totalBorrows.toString())
      .div(new Decimal(totalAssets.toString()))
      .mul(100)

    console.log(`[${
      blockDate.format('YYYY-MM-DD')
    }] total assets=${
      totalAssets.toString()
    }, total borrows=${
      totalBorrows.toString()
    }, utilization=${
      utilization.toSD(4).toString()
    }%`)
  }

  console.log(`Script completed`)
}
