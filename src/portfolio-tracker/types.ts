export interface PortfolioItem {
  name: string
  address: string
  depositTime: string
  depositAsset0: string
  depositAsset1: string
  depositAmount0: string
  depositAmount1: string
  depositValue0: string
  depositValue1: string
  depositValue: string
  rewardAsset0: string
  rewardAsset1: string
  rewardAmount0: string
  rewardAmount1: string
  rewardValue0: string
  rewardValue1: string
  rewardValue: string
  totalDays: string
  totalBlocks: string
  apr: string
  type: string
  depositLink: string
}

export const PortfolioItemsOrder: Array<keyof PortfolioItem> = [
  'depositTime',
  'depositAsset0',
  'depositAsset1'
]

export const ColumnTitles: Record<string, string> = {
  'apr': 'time /  apy since deposit'
}

export interface PositionReward {
  asset: string
  amount: string
  value: string
}

export interface WalletHistoryItem {
  time: string
  type: string
  amount: string
  value: string
  totalSonicValue: string
  totalUsdValue: string
}
