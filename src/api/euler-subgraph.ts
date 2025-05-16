import axios from "axios";

const client = axios.create({
  baseURL: 'https://api.studio.thegraph.com/query/107620/euler-apr/version/latest',
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
  vault: string  // Added vault field
}

export const getEulerDeposits = async (
  owner: string,
  vaultAddress?: string  // Optional parameter to filter by specific vault
) => {
  // Construct the where clause based on parameters
  let whereClause = `owner: "${owner}"`
  
  // Add vault filter if provided
  if (vaultAddress) {
    whereClause += `, vault: "${vaultAddress}"`
  }
  
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
            ${whereClause}
          },
          orderBy: blockNumber,
          orderDirection: desc
        ) {
          id
          blockNumber
          blockTimestamp
          transactionHash
          sender
          assets
          shares
          vault
        }
      }
    `
  })

  return data.data.deposits
}