import {
  Deposit as DepositEvent,
} from "../generated/SiloRouterV2/SiloRouterV2"
import {
  RouterDeposit
} from "../generated/schema"

export function handleDeposit(event: DepositEvent): void {
  const id = event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  const deposit = new RouterDeposit(id)

  deposit.user = event.params.user
  deposit.silo = event.params.silo
  deposit.amount = event.params.amount
  deposit.timestamp = event.block.timestamp
  deposit.transactionHash = event.transaction.hash

  deposit.save()
}