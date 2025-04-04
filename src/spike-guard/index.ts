import {ethers} from "ethers";
require('dotenv').config()
const GaugeV3ABI = require('../abi/GaugeV3.json');
const NonfungiblePositionManagerABI = require('../abi/NonfungiblePositionManager.json');
const RamsesV3PoolABI = require('../abi/RamsesV3Pool.json');

const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");
const OwnerPrivateKey = process.env.OWNER_PRIVATE_KEY || ''

const vFatPoolAddress = '0xf8440c989c72751c3a36419e61b6f62dfeb7630e'
const ShadowRamsesV3PoolAddress = '0x2C13383855377faf5A562F1AeF47E4be7A0f12Ac'
const tokenId = '551084'

if(!OwnerPrivateKey) {
  console.error('Missing env: OWNER_PRIVATE_KEY, exit')
  process.exit(1)
}

const main = async () => {
  const gaugeContract = new ethers.Contract(vFatPoolAddress, GaugeV3ABI, provider);
  const nfpManagerAddress = await gaugeContract.nfpManager()

  const nfp= new ethers.Contract(nfpManagerAddress, NonfungiblePositionManagerABI, provider);
  const ramsesV3Pool = new ethers.Contract(ShadowRamsesV3PoolAddress, RamsesV3PoolABI, provider);
  const [token0, token1, tickSpacing, tickLower, tickUpper, liquidity] = await nfp.positions(tokenId) as [string, string, bigint, bigint, bigint, bigint]
  const [_, currentTick] = await ramsesV3Pool.slot0()
  console.log(tickLower, tickUpper, currentTick)
}

main()
