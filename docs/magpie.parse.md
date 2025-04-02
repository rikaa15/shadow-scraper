```shell
0x664cc2BcAe1E057EB1Ec379598c5B743Ad9Db6e7

https://sonicscan.org/address/0x664cc2BcAe1E057EB1Ec379598c5B743Ad9Db6e7#readProxyContract

stakingToken aUSDC LP: 0x3f5ea53d1160177445b1898afbb16da111182418

pending reward = (user.amount * pool.accPenpiePerShare) - user.rewardDebt

1) call userInfo

amount   uint256 :  14290547
rewardDebt   uint256 :  0
available   uint256 :  14290547
unClaimedPenpie   uint256 :  0

2) call tokenToPoolInfo (0x3f5ea53d1160177445b1898afbb16da111182418)

stakingToken   address :  0x3F5EA53d1160177445B1898afbB16da111182418
receiptToken   address :  0xFB38A9E259D9C13f470feD6AF907B2aE83eDb43E
allocPoint   uint256 :  0
lastRewardTimestamp   uint256 :  1743504914
accPenpiePerShare   uint256 :  0
totalStaked   uint256 :  6543287551595
rewarder   address :  0x1Bfaf418C13e36958b0b6736B27C3E8bC1F9bB91
isActive   bool :  true



allPendingTokens

[ allPendingTokens(address,address) method Response ]
  pendingPenpie   uint256 :  0
  bonusTokenAddresses   address[] :  
[[0xf1eF7d2D4C0c881cd634481e0586ed5d2871A74B]]
  bonusTokenSymbols   string[] :  PENDLE
  pendingBonusRewards   uint256[] :  4671477202988068

  Pendle $2.85

  4671477202988068 / 10**18 * 2.85 = 0.013313710028515993


///


graph init magpiependlemarketv3 --from-contract="0x664cc2BcAe1E057EB1Ec379598c5B743Ad9Db6e7" --abi="../abi/MasterPenpie.json" --network="Sonic"
```
