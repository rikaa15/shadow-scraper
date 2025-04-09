import axios from "axios";

const client = axios.create({
  baseURL: 'https://api.studio.thegraph.com/query/108274/eulerfinance/version/latest',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.SUBGRAPH_API_KEY}`
  }
})

export interface DepositEvent {
  id: string
  blockNumber: string
  blockTimestamp: string
  transactionHash: string
  sender: string
  assets: string
  shares: string
}

export const getEulerDeposits = async (
  owner: string
) => {
  const { data } = await client.post<{
    data: {
      deposits: DepositEvent[]
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
