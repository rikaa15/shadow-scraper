import axios from "axios";
import 'dotenv/config'

const API_KEY = process.env.SUBGRAPH_API_KEY;

const balancerSubgraphUrl = `https://gateway-arbitrum.network.thegraph.com/api/${API_KEY}/subgraphs/id/wwazpiPPt5oJMiTNnQ2VjVxKnKakGDuE2FfEZPD4TKj`;

const balancerClient = axios.create({
  baseURL: balancerSubgraphUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

export async function getUserLiquidityInfo(
  userAddress: string,
  poolId: string
): Promise<any> {
  const subgraphQuery = `
  {
    poolShares(where: {
      userAddress: "${userAddress.toLowerCase()}",
      poolId_contains: "${poolId}"
    }) {
      id
      balance
      poolId {
        id
        address
        totalLiquidity
        totalShares
        tokens {
          address
          symbol
          name
          balance
          decimals
        }
      }
    }

    joinExits(where: {
      user: "${userAddress.toLowerCase()}",
      pool_contains: "${poolId}",
      type: "Join"
    }, orderBy: timestamp, orderDirection: asc, first: 1) {
      id                 
      timestamp          
      type              
      amounts           
      valueUSD
      block
      pool {
        id
        tokens {
          address
          symbol
          name
          decimals
        }
      }     
    }
  }  
  `;
  
  const response = await balancerClient.post('', { query: subgraphQuery });
  
  if (response.data.errors) {
    console.error("GraphQL errors:", response.data.errors);
    throw new Error("GraphQL query failed: " + JSON.stringify(response.data.errors));
  }
  
  if (!response.data.data) {
    console.error("No data returned from the GraphQL query");
    throw new Error("No data returned from the GraphQL query");
  }
  return response.data.data
}
