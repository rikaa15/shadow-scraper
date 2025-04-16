import { MerklApi } from '@merkl/api';
const merkl = MerklApi('https://api.merkl.xyz').v4;
const rewards = await merkl
  .users({ address: '0xYourWalletAddressHere' })
  .rewards.get({ query: { chainId: 146 } });

console.log('User Rewards:', rewards.data);
