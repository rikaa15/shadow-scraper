import axios, { AxiosError } from "axios";
import { ethers } from "ethers";

const beefyClient = axios.create({
  baseURL: 'https://api.beefy.finance'
});

const beefeDatabarnClient = axios.create({
  baseURL: 'https://databarn.beefy.finance'
})

export type PriceType = 'underlying_to_usd' | 'share_to_underlying'

export interface BeefyPpfsHistoryPrice {
  timestamp: string;
  blockNumber: number;
  ppfsPrice: string;
}

// Interface for Beefy vault information
export interface BeefyVault {
  id: string;
  name: string;
  token: string;
  tokenAddress: string;
  tokenDecimals: number;
  tokenProviderId: string;
  earnedToken: string;
  earnedTokenAddress: string;
  earnContractAddress: string;
  oracle: string;
  oracleId: string;
  status: string; // 'active' or 'eol'
  platformId: string;
  assets: string[];
  strategyTypeId: string;
  risks: string[];
  addLiquidityUrl?: string;
  network: string;
  createdAt: number;
  chain: string;
  strategy: string;
  lastHarvest: number;
  pricePerFullShare: string;
}

/**
 * Fetches all vaults from Beefy
 * @returns Promise with array of all Beefy vaults (including EOL vaults)
 */
export const getAllBeefyVaults = async (): Promise<BeefyVault[]> => {
  try {
    const { data } = await beefyClient.get<BeefyVault[]>('/vaults');
    return data;
  } catch (error) {
    console.error('Error fetching vaults from Beefy API:', error);
    return [];
  }
};

/**
 * Fetches a specific vault by its contract address with caching
 * @param vaultAddress The contract address of the vault (earnContractAddress)
 * @param forceRefresh Set to true to bypass cache
 * @returns Promise with the vault information or null if not found
 */
export const getBeefyVaultByAddress = async (
  vaultAddress: string, 
): Promise<BeefyVault | null> => {
  // Normalize the address
  const normalizedAddress = vaultAddress.toLowerCase();
  
  try {
    // Fetch fresh data if cache is invalid or force refresh requested
    const vaults = await getAllBeefyVaults();
    const vault = vaults.find(
      v => v.earnContractAddress.toLowerCase() === normalizedAddress
    );
    
    // Update cache (even store null results to avoid redundant searches)
   // saveVaultToCache(normalizedAddress, vault || null);
    
    return vault || null;
  } catch (error) {
    console.error('Error getting vault by address:', error);
    return null;
  }
};

/**
 * Gets the current APY for a vault (if available)
 * @param vaultId The ID of the vault
 * @returns Promise with the APY as a number (or null if not available)
 */
export const getVaultAPY = async (vaultId: string): Promise<number | null> => {
  try {
    const { data } = await beefyClient.get<Record<string, number>>('/apy');
    return data[vaultId] ?? null;
  } catch (error) {
    console.error('Error fetching APY data:', error);
    return null;
  }
};

/**
 * Gets the detailed APY breakdown for a vault (if available)
 * @param vaultId The ID of the vault
 * @returns Promise with the APY breakdown (or null if not available)
 */
export const getVaultAPYBreakdown = async (vaultId: string): Promise<any | null> => {
  try {
    const { data } = await beefyClient.get<Record<string, any>>('/apy/breakdown');
    return data[vaultId] ?? null;
  } catch (error) {
    console.error('Error fetching APY breakdown data:', error);
    return null;
  }
};

/**
 * Gets the TVL (Total Value Locked) for a vault (if available)
 * @param vaultId The ID of the vault
 * @returns Promise with the TVL in USD (or null if not available)
 */
export const getVaultTVL = async (vaultId: string): Promise<number | null> => {
  try {
    const { data } = await beefyClient.get<Record<string, number>>('/tvl');
    return data[vaultId] ?? null;
  } catch (error) {
    console.error('Error fetching TVL data:', error);
    return null;
  }
};

/**
 * Helper function to get date one month ago in ISO format
 */
function getFromDate(depositTransactionDate: string): string {
  const date = new Date(depositTransactionDate);
  date.setMinutes(date.getMinutes() - 1);
  return date.toISOString().split('.')[0];
}

function getToDate(depositTransactionDate: string): string {
  const date = new Date(depositTransactionDate);
  date.setMinutes(date.getMinutes() + 1);
  return date.toISOString().split('.')[0];
}
// Interface for the price data response
export interface PriceDataPoint {
  timestamp: string;
  value: string;
}

export const getPpfsPrice = async (
  address: string,
  depositTransactionDate: string,
  depositBlockNumber: number,
  priceType: PriceType = 'share_to_underlying',
  productType = 'vault',
  chain = 'sonic',
): Promise<BeefyPpfsHistoryPrice | null> => {
  try {
    // return {
    //   timestamp: '2025-04-30T20:23:28.000Z',
    //   blockNumber: 23364608,
    //   ppfsPrice: '1.027802424850797197000000'
    // }
    const fromDate: string = getFromDate(depositTransactionDate)
    const toDate: string = getToDate(depositTransactionDate)
    // Format the dates properly for the API
    const fromDateParam = encodeURIComponent(fromDate);
    const toDateParam = encodeURIComponent(toDate);
    
    const productId = `beefy:${productType}:${chain}:${address.toLowerCase()}`
    // Build the URL with proper parameters
    const url = `/api/v1/price/raw?product_key=${encodeURIComponent(productId)}&price_type=${priceType}&from_date_utc=${fromDateParam}&to_date_utc=${toDateParam}`;
        
    const response = await beefeDatabarnClient.get(url);
    // The API returns an array of arrays with timestamp and value
    const fco = response.data[0][1]
    if (Array.isArray(response.data) && response.data.length > 0) {
      // Transform the data into a more usable format
      const depositPpfs = response.data.find((price: any) => Number(price[1]) === Number(depositBlockNumber))
      if (depositPpfs) {
        return {
          timestamp: depositPpfs[0],
          blockNumber: depositPpfs[1],
          ppfsPrice: depositPpfs[2]
        }
      }
    }
    return null;
  } catch (error) {
    const axiosError = error as AxiosError;
    
    if (axiosError.response) {
      console.error('Error response:', {
        status: axiosError.response.status,
        statusText: axiosError.response.statusText,
        data: axiosError.response.data
      });
      if (axiosError.response.status === 404) {
        console.warn(`No price data found for vault: ${address}`);
      }
    } else if (axiosError.request) {
      console.error('No response received:', axiosError.request);
    } else {
      console.error('Error setting up request:', axiosError.message);
    }
    
    return null;
  }
};


export const getBeefyVaultUSDValue = async (vaultAddress: string, underlyingAmount: bigint) => {
  try {
    // Get vault information from Beefy API
    const vaultInfo = await getBeefyVaultByAddress(vaultAddress);
    if (vaultInfo) {
      // Get the current LP/token price
      const pricesResponse = await fetch('https://api.beefy.finance/lps');
      const prices = await pricesResponse.json();

      // Try to find the price using the oracleId from vault info
      const lpPrice = prices[vaultInfo.oracleId];
      
      return parseFloat(ethers.formatUnits(underlyingAmount, vaultInfo.tokenDecimals)) * lpPrice;

    }
    // If no price found, return 0
    console.warn(`No price found for vault ${vaultAddress}`);
    return 0;
  } catch (error) {
    console.error('Error getting USD value:', error);
    return 0;
  }
};