import {
  FeeAdjustment as FeeAdjustmentEvent,
  FeeCollectorChanged as FeeCollectorChangedEvent,
  PoolCreated as PoolCreatedEvent,
  SetFeeProtocol as SetFeeProtocolEvent,
  SetPoolFeeProtocol as SetPoolFeeProtocolEvent,
  TickSpacingEnabled as TickSpacingEnabledEvent
} from "../generated/RamsesV3Factory/RamsesV3Factory"
import {
  FeeAdjustment,
  FeeCollectorChanged,
  PoolCreated,
  SetFeeProtocol,
  SetPoolFeeProtocol,
  TickSpacingEnabled
} from "../generated/schema"

export function handleFeeAdjustment(event: FeeAdjustmentEvent): void {
  let entity = new FeeAdjustment(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.pool = event.params.pool
  entity.newFee = event.params.newFee

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleFeeCollectorChanged(
  event: FeeCollectorChangedEvent
): void {
  let entity = new FeeCollectorChanged(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.oldFeeCollector = event.params.oldFeeCollector
  entity.newFeeCollector = event.params.newFeeCollector

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePoolCreated(event: PoolCreatedEvent): void {
  let entity = new PoolCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.token0 = event.params.token0
  entity.token1 = event.params.token1
  entity.fee = event.params.fee
  entity.tickSpacing = event.params.tickSpacing
  entity.pool = event.params.pool

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleSetFeeProtocol(event: SetFeeProtocolEvent): void {
  let entity = new SetFeeProtocol(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.feeProtocolOld = event.params.feeProtocolOld
  entity.feeProtocolNew = event.params.feeProtocolNew

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleSetPoolFeeProtocol(event: SetPoolFeeProtocolEvent): void {
  let entity = new SetPoolFeeProtocol(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.pool = event.params.pool
  entity.feeProtocolOld = event.params.feeProtocolOld
  entity.feeProtocolNew = event.params.feeProtocolNew

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTickSpacingEnabled(event: TickSpacingEnabledEvent): void {
  let entity = new TickSpacingEnabled(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tickSpacing = event.params.tickSpacing
  entity.fee = event.params.fee

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
