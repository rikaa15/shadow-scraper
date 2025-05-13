import axios from "axios";

const client = axios.create({
  baseURL: 'https://api.studio.thegraph.com/query/107620/beefy-sonic-ppfs/version/latest',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.SUBGRAPH_API_KEY}`
  }
})


export interface BeefyTransaction {
  id: string
  hash: string
  blockNumber: number
  timestamp: string
  type: string
  amount: string
}

export const getBeefyDeposits = async (
  userAddress: string,
  vaultAddress?: string
) => {
  // Convert addresses to lowercase for proper comparison
  const formattedUserAddress = userAddress.toLowerCase();

  // Build query conditions
  let whereCondition = `user_: {address: "${formattedUserAddress}"}`;

  if (vaultAddress) {
    whereCondition += `, vault_: {address: "${vaultAddress.toLowerCase()}"}`;
  }

  // Add type condition to get only deposits (mint transactions)
  whereCondition += `, type: "mint"`;

  const { data } = await client.post<{
    data: {
      transactions: BeefyTransaction[]
    }
  }>('/', {
    query: `
      {
        transactions(
          first: 1000,
          where: {${whereCondition}},
          orderBy: blockNumber,
          orderDirection: desc
        ) {
          id
          hash
          blockNumber
          timestamp
          type
          amount
        }
      }
    `
  })

  return data.data.transactions
}
