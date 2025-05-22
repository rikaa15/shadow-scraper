import { Deposit as DepositEvent } from "../generated/SiloLBTCVault/SiloLBTCVault"
import { VaultDeposit } from "../generated/schema"

export function handleDeposit(event: DepositEvent): void {
  const id = event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  const deposit = new VaultDeposit(id)

  deposit.user = event.params.sender
  deposit.silo = event.params.owner
  deposit.amount = event.params.assets
  deposit.shares = event.params.shares
  deposit.timestamp = event.block.timestamp
  deposit.transactionHash = event.transaction.hash

  deposit.save()
}
