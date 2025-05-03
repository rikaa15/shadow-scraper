import axios, { AxiosError } from "axios";

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

// Cache configuration
const CACHE_PREFIX = 'beefy_vault_';
const CACHE_EXPIRY = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Saves a vault to localStorage with expiry time
 */
const saveVaultToCache = (vaultAddress: string, vault: BeefyVault | null) => {
  try {
    const cacheKey = `${CACHE_PREFIX}${vaultAddress.toLowerCase()}`;
    const cacheData = {
      timestamp: Date.now(),
      vault: vault
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to save vault to cache:', error);
  }
};

/**
 * Retrieves a vault from cache if valid
 */
const getVaultFromCache = (vaultAddress: string): BeefyVault | null => {
  try {
    const cacheKey = `${CACHE_PREFIX}${vaultAddress.toLowerCase()}`;
    const cachedData = localStorage.getItem(cacheKey);
    if (!cachedData) return null;
    
    const parsedData = JSON.parse(cachedData);
    const isExpired = Date.now() - parsedData.timestamp > CACHE_EXPIRY;
    
    return isExpired ? null : parsedData.vault;
  } catch (error) {
    console.warn('Failed to retrieve vault from cache:', error);
    return null;
  }
};

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
  forceRefresh = false
): Promise<BeefyVault | null> => {
  // Normalize the address
  const normalizedAddress = vaultAddress.toLowerCase();
  
  // Try to get from cache first (unless force refresh is requested)
  if (!forceRefresh) {
    const cachedVault = getVaultFromCache(normalizedAddress);
    if (cachedVault !== null) {
      return cachedVault; // This returns null if vault wasn't found earlier
    }
  }
  
  try {
    // Fetch fresh data if cache is invalid or force refresh requested
    const vaults = await getAllBeefyVaults();
    const vault = vaults.find(
      v => v.earnContractAddress.toLowerCase() === normalizedAddress
    );
    
    // Update cache (even store null results to avoid redundant searches)
    saveVaultToCache(normalizedAddress, vault || null);
    
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
    
    console.log(`Requesting: ${url}`);
    
    const response = await beefeDatabarnClient.get(url);

    // The API returns an array of arrays with timestamp and value
    if (Array.isArray(response.data) && response.data.length > 0) {
      // Transform the data into a more usable format
      const depositPpfs = response.data.find((price: any) => price[1] === depositBlockNumber)
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


/**
 * Clears the cache for a specific vault
 */
export const clearVaultCache = (vaultAddress: string): void => {
  try {
    const cacheKey = `${CACHE_PREFIX}${vaultAddress.toLowerCase()}`;
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.warn('Failed to clear vault cache:', error);
  }
};