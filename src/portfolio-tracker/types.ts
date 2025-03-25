export interface PortfolioItem {
  asset: string
  address: string
  depositTime: string
  deposit0Asset: string
  deposit1Asset: string
  deposit0Amount: string
  deposit1Amount: string
  deposit0Value: string
  deposit1Value: string
  reward0Asset: string
  reward1Asset: string
  reward0Amount: string
  reward1Amount: string
  reward0Value: string
  reward1Value: string
  totalDays: string
  totalBlocks: string
  apr: string
  type: string
  link: string
}

export const PortfolioItemsOrder: Array<keyof PortfolioItem> = [
  'depositTime',
  'deposit0Asset',
  'deposit1Asset'
]

export const ColumnTitles: Record<string, string> = {
  'apr': 'time /  apy since deposit'
}

export interface PositionReward {
  asset: string
  amount: string
  value: string
}
