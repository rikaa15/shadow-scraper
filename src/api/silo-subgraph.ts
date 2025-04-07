import axios from "axios";

const client = axios.create({
  baseURL: 'https://api.studio.thegraph.com/query/108274/silofinance/version/latest',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.SUBGRAPH_API_KEY}`
  }
})

export interface SiloDepositEvent {
  id: string
  blockNumber: string
  blockTimestamp: string
  transactionHash: string
  sender: string
  assets: string
  shares: string
}

export const getSiloDeposits = async (
  owner: string
) => {
  const { data } = await client.post<{
    data: {
      deposits: SiloDepositEvent[]
    }
  }>('/', {
    query: `
      {
        deposits(
          first: 1000,
          where: {
            owner: "${owner}"
          },
          orderBy:blockNumber,
          orderDirection:desc
        ) {
          id
          blockNumber
          blockTimestamp
          transactionHash
          sender
          assets
          shares
        }
    }
    `
  })

  return data.data.deposits
}
