import axios from 'axios';
require('dotenv').config()

const SonicApiKey = process.env.SONICSCAN_API_KEY || ''

const client = axios.create({
  baseURL: 'https://api.sonicscan.org/api',
})

export interface GetTransactionsParams {
  address: string
  startblock?: number
  endblock?: number
  page?: number
  offset?: number
  sort?: 'asc' | 'desc'
}

export interface RpcTransaction {
  blockNumber: string
  blockHash: string
  timeStamp: string
  hash: string
  nonce: string
  transactionIndex: string
  from: string
  to: string
  value: string
  gas: string
  gasPrice: string
  input: string
  methodId: string
  functionName: string
  contractAddress: string
  cumulativeGasUsed: string
  txreceipt_status: string
  gasUsed: string
  confirmations: string
  isError: string
}

export const getTransactions = async (
  params: GetTransactionsParams,
  apiKey= SonicApiKey
) => {
  const { data } = await client.get<{
    status: string
    message: string
    result: RpcTransaction[]
  }>(`/?module=account`, {
    params: {
      action: 'txlist',
      ...params,
      apiKey
    }
  })
  return data.result
}
