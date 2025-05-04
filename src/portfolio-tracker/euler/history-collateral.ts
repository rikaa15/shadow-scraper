import moment from "moment";
import {ethers} from "ethers";
import {getClosestBlockByTimestamp} from "../../api/rpc";
import {roundToSignificantDigits} from "../helpers";
import Decimal from "decimal.js";
import EulerEVaultABI from '../../abi/EulerEVault.json'

const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");
const vaultAddress = '0x196F3C7443E940911EE2Bb88e019Fd71400349D9'
const vault = new ethers.Contract(vaultAddress, EulerEVaultABI, provider);

export const getEulerCollateralHistory = async () => {
  const vaultName = await vault.name() as string

  const daysCount = 30

  console.log(`Euler vault ${vaultName}`)
  for(let i = 0; i < daysCount; i++) {
    const blockDate = moment().subtract(i + 1, "days").endOf('day')
    const blockTimestamp = blockDate.unix()

    const block = await getClosestBlockByTimestamp(
      blockTimestamp
    )

    if(!block) {
      console.log(`No block for timestamp=${blockTimestamp}, stop`)
      break
    }

    const blockTag = block.blockNumber
    const totalBorrows = await vault.totalBorrows({ blockTag }) as bigint
    const totalAssets = await vault.totalAssets({ blockTag }) as bigint

    const utilization = new Decimal(totalBorrows.toString())
      .div(new Decimal(totalAssets.toString()))
      .mul(100)

    console.log(`[${
      blockDate.format('YYYY MMM DD')
    }] total borrows=${
      new Decimal(totalBorrows.toString())
        .div(10 ** 6)
        .div(10 ** 6)
        .toSD(4)
        .toString()
    }M, total supply=${
      new Decimal(totalAssets.toString())
        .div(10 ** 6)
        .div(10 ** 6)
        .toSD(4)
        .toString()
    }M, utilization=${
      utilization
        .toSD(4)
        .toString()
    }%`)
  }

  console.log(`Script completed`)
}
