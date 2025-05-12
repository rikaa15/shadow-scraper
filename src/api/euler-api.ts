import axios from "axios";

const client = axios.create({
  baseURL: 'https://app.euler.finance/api/v2'
})

export interface MerklRewards {
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

export const getMerklRewards = async (walletAddress: string) => {
  const { data } = await client.get<MerklRewards[]>(`rewards/merkl/user?chainId=146&address=${walletAddress}`)
  return data
}
