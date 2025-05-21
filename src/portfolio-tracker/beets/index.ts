import { ethers } from 'ethers';
import { PortfolioItem } from '../types';
import { portfolioItemFactory, roundToSignificantDigits } from '../helpers';
import moment from 'moment';
import { getUnderlyingTokenUSDPrice } from '../../api/beets-api';
import { getUserLiquidityInfo } from '../../api/beets-subgraph';

const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");

const vaultArray = [
  {
    name: `Lombard's Orbit: The Elliptic Dance`,
    address:'0xBA12222222228d8Ba445958a75a0704d566BF2C8',
    poolId: '0x83952912178aa33c3853ee5d942c96254b235dcc', // '0x83952912178aa33c3853ee5d942c96254b235dcc0002000000000000000000ab' , //  '0x83952912178aa33c3853ee5d942c96254b235dcc',
    url: 'https://beets.fi/pools/sonic/v2/0x83952912178aa33c3853ee5d942c96254b235dcc0002000000000000000000ab',
    type: 'pool'
  },  
];

const getTokenReward = (token: any, totalGain: number, currentPositionValue: number): { rewardValue: number, rewardAmount: number} => {
  const tokenValuePercentage = token.value / currentPositionValue;
  const tokenRewardValue = totalGain * tokenValuePercentage;
  const tokenRewardAmount = tokenRewardValue / token.price
  
  return {
    rewardValue: tokenRewardValue,
    rewardAmount: tokenRewardAmount
  }
}

export const getBeetsInfo = async (walletAddress: string) => {
  const portfolioItems: PortfolioItem[] = [];
  const formattedWalletAddress = ethers.getAddress(walletAddress);

  const vaultPromises = vaultArray.map(async (vault) => { 
    const userLiquidityInfo = await getUserLiquidityInfo(formattedWalletAddress, vault.poolId)
    const initialDeposit = userLiquidityInfo.joinExits[0]
    let currentBptPrice = 0
    let currentPositionValue = 0
    let token0rewards = undefined
    let token1rewards = undefined
    let totalRewards = 0

    const firstDepositTimestamp = new Date(initialDeposit?.timestamp * 1000).toISOString();
    const currentBlockNumber = await provider.getBlockNumber();
    const totalBlocks = currentBlockNumber - +initialDeposit.block;
    const depositDate = new Date(firstDepositTimestamp);
    const currentDate = new Date();
    const daysElapsed = (currentDate.getTime() - depositDate.getTime()) / (1000 * 60 * 60 * 24);

    const currentTokenBalances: any[] = []

    // Process tokens  
    const tokensDeposited = initialDeposit.amounts.map((amount: string, index: number) => {
      const token = initialDeposit.pool.tokens[index];
      
      if (!initialDeposit) {
        return
      }
      // Parse amount properly
      const amountInTokenUnits = parseFloat(amount);
      
      // Skip tokens with zero amount
      if (amountInTokenUnits === 0) {
        return null;
      }
      console.log()
      return {
        symbol: token.symbol,
        name: token.name || token.symbol,
        address: token.address,
        amount: amountInTokenUnits.toString(),
        decimals: parseInt(token.decimals)
      };
    }).filter(Boolean); 


    // position no staked
    if (userLiquidityInfo.poolShares && userLiquidityInfo.poolShares.length > 0) {
      const share = userLiquidityInfo.poolShares[0];
      const pool = share.poolId;

      const userSharePercentage = parseFloat(share.balance) / parseFloat(pool.totalShares);
      currentBptPrice = parseFloat(pool.totalLiquidity) / parseFloat(pool.totalShares);

      for (const token of pool.tokens) { 
        const poolTokenBalance = parseFloat(token.balance)  
        const userTokenBalance = poolTokenBalance * userSharePercentage;
        const tokenPrice = await getUnderlyingTokenUSDPrice(token.symbol);
        const tokenValue = userTokenBalance * tokenPrice;
        currentPositionValue += tokenValue;
        
        currentTokenBalances.push({
          symbol: token.symbol,
          name: token.name || token.symbol,
          address: token.address,
          balance: userTokenBalance,
          decimals: parseInt(token.decimals),
          price: tokenPrice,
          value: tokenValue
        });
      }
      
      const totalGain = currentPositionValue - initialDeposit.valueUSD;
      token0rewards = getTokenReward(currentTokenBalances[0], totalGain, currentPositionValue)
      token1rewards = currentTokenBalances[1] ? getTokenReward(currentTokenBalances[1], totalGain, currentPositionValue) : undefined
      totalRewards = token0rewards.rewardValue + (token1rewards?.rewardValue ?? 0)
    }

    const portfolioItem: PortfolioItem = {
          ...portfolioItemFactory(),
          type: vault.type,
          name: vault.name,
          address: vault.address,
          depositTime: moment(firstDepositTimestamp).format('YY/MM/DD HH:MM:SS'),
          depositAsset0: tokensDeposited[0] ? tokensDeposited[0].symbol :  '',
          depositAsset1: tokensDeposited[1] ? tokensDeposited[1].symbol :  '', //depositInfo?.depositAsset1 ?? '',
          depositAmount0: tokensDeposited[0] ? roundToSignificantDigits(`${tokensDeposited[0].amount}`) :  '',
          depositAmount1: tokensDeposited[1] ? roundToSignificantDigits(`${tokensDeposited[1].amount}`) :  '',
          depositValue0: '',
          depositValue1: '',
          depositValue: roundToSignificantDigits(initialDeposit.valueUSD.toString()),
          rewardAsset0: tokensDeposited[0] && token0rewards ? tokensDeposited[0].symbol :  '',
          rewardAsset1: tokensDeposited[1] && token1rewards ? tokensDeposited[1].symbol :  '',
          rewardAmount0: token0rewards ? roundToSignificantDigits(token0rewards.rewardAmount.toString()) : '',
          rewardAmount1: token1rewards ? roundToSignificantDigits(token1rewards.rewardAmount.toString()) : '',
          rewardValue0: token0rewards ? roundToSignificantDigits(token0rewards.rewardValue.toString()) : '',
          rewardValue1: token1rewards ? roundToSignificantDigits(token1rewards.rewardValue.toString()) : '',
          rewardValue: roundToSignificantDigits(totalRewards.toString(), 2),
          totalDays: roundToSignificantDigits(`${daysElapsed}`, 4),
          totalBlocks: `${totalBlocks}`,
          apr: '0', // roundToSignificantDigits(apr.toString()),
          depositLink: vault.url
        };
    
        return portfolioItem;
  })
  
   const results = await Promise.all(vaultPromises);

  results.forEach(item => {
    if (item) portfolioItems.push(item);
  });

  return portfolioItems;
  
}