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
    const blockDate = moment().subtract(i, "days").endOf('day')
    const blockTimestamp = blockDate.unix()

    const block = await getClosestBlockByTimestamp(
      blockTimestamp
    )

    if(!block) {
      console.log(`No block for timestamp=${blockTimestamp}, stop`)
      break
    }

    const blockTag = block.blockNumber
    const ltvList = await vault.LTVList({ blockTag }) as string[]
    for(const ltvAddress of ltvList) {
      const ltvVault = new ethers.Contract(ltvAddress, EulerEVaultABI, provider);
      const [
        borrowLTV,
        liquidationLTV,
        initialLiquidationLTV,
        targetTimestamp,
        rampDuration
      ] = await vault.LTVFull(ltvAddress, { blockTag }) as [bigint, bigint, bigint, bigint, bigint]
      const ltvSymbol = await ltvVault.symbol()
      console.log(`[${
        blockDate.format('YYYY MMM DD')
      }] vault=${ltvSymbol}, LTV=${
        new Decimal(borrowLTV.toString()).div(100)
          .toSD(4).toString()
      }%, LLTV=${
        new Decimal(liquidationLTV.toString()).div(100)
          .toSD(4).toString()
      }%`)
    }
  }

  console.log(`Script completed`)
}
