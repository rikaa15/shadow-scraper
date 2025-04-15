import {ethers} from "ethers";
import Decimal from "decimal.js";
import {getSpectraData} from "../../api/spectra";
const YieldTokenABI = require('./YieldToken.json');
const PrincipalTokenABI = require('./PrincipalToken.json');

const ytAddress = '0x96E15759F99502692F7b39c3A80FE44C5da7DC8d'
const ptAddress = '0x7002383d2305B8f3b2b7786F50C13D132A22076d'

const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");

export const getSpectraInfo = async (
  walletAddress: string
) => {
  const yt = new ethers.Contract(ytAddress, YieldTokenABI, provider);
  const pt = new ethers.Contract(ptAddress, PrincipalTokenABI, provider);

  // const balance = await yt.balanceOf(walletAddress) as bigint
  // const totalSupply = await yt.totalSupply() as bigint
  // const maturity = Number(await pt.maturity() as bigint)

  const decimals = Number(await yt.decimals() as bigint)
  const claimableYield = await pt.getCurrentYieldOfUserInIBT(walletAddress) as bigint

  if(claimableYield > 0n) {
    let balance = '0'
    const data = await getSpectraData(walletAddress)
    if(data.length > 0) {
      const [spectraInfo] = data
      balance = new Decimal(spectraInfo.yt.balance)
        .div(10 ** decimals)
        .toString()
    }
    const reward = new Decimal(claimableYield.toString())
      .div(10 ** decimals)
      .toString()

    console.log('balance', balance)
    console.log('reward', reward)

    return {
      balance,
      reward
    }
  }
}

getSpectraInfo('0x4E430992Db6F3BdDbC6A50d1513845f087E9af4A')
