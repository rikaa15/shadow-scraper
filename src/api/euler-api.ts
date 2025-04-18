import axios from "axios";

const client = axios.create({
  baseURL: 'https://app.euler.finance/api/v2'
})

export interface EulerMerklRewards {
  accumulated: string
  chainId: number
  proof: string[]
  reward: {
    address: string
    decimals: number
    logoURI: string
    name: string
    symbol: string
  }
  tokenPrice: number
  unclaimed: string
}

export const getEulerMerklRewards = async (walletAddress: string) => {
  const { data } = await client.get<EulerMerklRewards[]>(`rewards/merkl/user?chainId=146&address=${walletAddress}`)
  return data
}
