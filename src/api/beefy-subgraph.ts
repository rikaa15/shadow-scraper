import axios from "axios";
import 'dotenv/config'

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
  
  // Build query conditions for both transaction types
  let whereConditionMint = `user_: {address: "${formattedUserAddress}"}, type: "mint"`;
  let whereConditionReceive = `user_: {address: "${formattedUserAddress}"}, type: "receive"`;
  
  if (vaultAddress) {
    const vaultCondition = `vault_: {address: "${vaultAddress.toLowerCase()}"}`;
    // ichi vaults
    whereConditionMint += `, ${vaultCondition}`;
    // shadow vaults
    whereConditionReceive += `, ${vaultCondition}`;
  }

  const { data } = await client.post<{
    data: {
      mintTransactions: BeefyTransaction[],
      receiveTransactions: BeefyTransaction[]
    }
  }>('/', {
    query: `
      {
        mintTransactions: transactions(
          first: 500,
          where: {${whereConditionMint}},
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
        
        receiveTransactions: transactions(
          first: 500,
          where: {${whereConditionReceive}},
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
  });

  // Combine and return both types of transactions
  if (!data?.data) {
    console.error('No data returned from GraphQL query');
    return [];
  }
  
  const mintTxs = data.data.mintTransactions || [];
  const receiveTxs = data.data.receiveTransactions || [];
  
  // Combine and sort by blockNumber descending
  return [...mintTxs, ...receiveTxs].sort((a, b) => b.blockNumber - a.blockNumber);
}

