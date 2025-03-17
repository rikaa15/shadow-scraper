import { promises as fsPromises } from 'fs';
import { parse } from 'csv-parse/sync';

interface Trade {
  txHash: string;
  blockNumber: string;
  timestamp: string;
  pool: string;
  poolId: string;
  origin: string;
  recipient: string;
  token0: string;
  token1: string;
  amount0: string;
  amount1: string;
  amountUSD: string;
}

async function calculateRange(prices: number[], targetCenter = 1, volumePercent = 90) {
    // Check if array is not empty
    if (!prices || prices.length === 0) {
        throw new Error('Price array cannot be empty');
    }

    // Sort prices
    const sortedPrices = [...prices].sort((a, b) => a - b);

    // Find the difference between current center and target center
    const priceDiff = targetCenter - sortedPrices[Math.floor(sortedPrices.length / 2)];

    // Shift all prices to center around $1
    const shiftedPrices = sortedPrices.map(price => price + priceDiff);

    // Find percentiles for volume
    const lowerPercentile = (100 - volumePercent) / 2;
    const upperPercentile = 100 - lowerPercentile;

    function percentile(arr: number[], p: number): number {
        if (p < 0 || p > 100) {
            throw new Error('Percentile must be between 0 and 100');
        }
        if (p === 0) return arr[0];
        if (p === 100) return arr[arr.length - 1];
        
        const index = (p / 100) * (arr.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        
        if (lower === upper) {
            return arr[lower];
        }
        
        const weight = index - lower;
        return arr[lower] * (1 - weight) + arr[upper] * weight;
    }

    const lowerBound = percentile(shiftedPrices, lowerPercentile);
    const upperBound = percentile(shiftedPrices, upperPercentile);

    return { lowerBound, upperBound };
}

async function analyzePool(poolName: string) {
    try {
        // Asynchronously read data file
        const fileData = await fsPromises.readFile(`export/shadow_swaps_${poolName}_1742226431.csv`, 'utf-8');
        
        // Parse CSV file
        const trades = parse(fileData, {
            columns: true,
            skip_empty_lines: true
        }) as Trade[];

        // Check for required columns
        if (!trades.length || !trades[0].amount0 || !trades[0].amount1) {
            throw new Error('Cannot find required columns amount0 or amount1 in data');
        }

        // Calculate prices for all trades
        const prices = trades.map(trade => {
            const amount0 = Number(trade.amount0);
            const amount1 = Number(trade.amount1);

            // Skip trade if amount0 or amount1 are invalid
            if (isNaN(amount0) || isNaN(amount1) || amount0 === 0) {
                return NaN;
            }
            return Math.abs(amount1) / Math.abs(amount0);
        }).filter(price => !isNaN(price)); // Filter out NaN values

        if (prices.length === 0) {
            throw new Error('No valid prices for analysis');
        }

        // Find range centered around $1
        const { lowerBound, upperBound } = await calculateRange(prices, 1, 90);
        const center = 1; // Center is always $1
        const range = (upperBound - lowerBound) / 2;
        const percentageFromCenter = (range / center) * 100;

        // Output results
        console.log(`\nAnalysis for pool ${poolName}:`, prices.length);
        console.log(`Range center: $${center.toFixed(8)}`);
        console.log(`Lower boundary (5%): $${lowerBound.toFixed(8)}`);
        console.log(`Upper boundary (95%): $${upperBound.toFixed(8)}`);
        console.log(`Range: ±${percentageFromCenter.toFixed(4)}% from center`);
    } catch (error: any) {
        console.error(`Error analyzing pool ${poolName}: ${error?.message}`);
    }
}

const main = async () => {
    try {
        await analyzePool('USDC.e_USDT');
    } catch (error: any) {
        console.error(`Error: ${error?.message}`);
    }
};

main();