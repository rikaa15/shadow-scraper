import { MerklApi } from '@merkl/api';
const merkl = MerklApi('https://api.merkl.xyz').v4;
const rewards = await merkl
  .users({ address: '0x4E430992Db6F3BdDbC6A50d1513845f087E9af4A' })
  .rewards.get({ query: { chainId: 146 } });

console.log('User Rewards:', rewards.data);
