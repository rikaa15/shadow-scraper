import { newMockEvent } from "matchstick-as"
import { ethereum, Address } from "@graphprotocol/graph-ts"
import {
  FeeAdjustment,
  FeeCollectorChanged,
  PoolCreated,
  SetFeeProtocol,
  SetPoolFeeProtocol,
  TickSpacingEnabled
} from "../generated/RamsesV3Factory/RamsesV3Factory"

export function createFeeAdjustmentEvent(
  pool: Address,
  newFee: i32
): FeeAdjustment {
  let feeAdjustmentEvent = changetype<FeeAdjustment>(newMockEvent())

  feeAdjustmentEvent.parameters = new Array()

  feeAdjustmentEvent.parameters.push(
    new ethereum.EventParam("pool", ethereum.Value.fromAddress(pool))
  )
  feeAdjustmentEvent.parameters.push(
    new ethereum.EventParam(
      "newFee",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(newFee))
    )
  )

  return feeAdjustmentEvent
}

export function createFeeCollectorChangedEvent(
  oldFeeCollector: Address,
  newFeeCollector: Address
): FeeCollectorChanged {
  let feeCollectorChangedEvent = changetype<FeeCollectorChanged>(newMockEvent())

  feeCollectorChangedEvent.parameters = new Array()

  feeCollectorChangedEvent.parameters.push(
    new ethereum.EventParam(
      "oldFeeCollector",
      ethereum.Value.fromAddress(oldFeeCollector)
    )
  )
  feeCollectorChangedEvent.parameters.push(
    new ethereum.EventParam(
      "newFeeCollector",
      ethereum.Value.fromAddress(newFeeCollector)
    )
  )

  return feeCollectorChangedEvent
}

export function createPoolCreatedEvent(
  token0: Address,
  token1: Address,
  fee: i32,
  tickSpacing: i32,
  pool: Address
): PoolCreated {
  let poolCreatedEvent = changetype<PoolCreated>(newMockEvent())

  poolCreatedEvent.parameters = new Array()

  poolCreatedEvent.parameters.push(
    new ethereum.EventParam("token0", ethereum.Value.fromAddress(token0))
  )
  poolCreatedEvent.parameters.push(
    new ethereum.EventParam("token1", ethereum.Value.fromAddress(token1))
  )
  poolCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "fee",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(fee))
    )
  )
  poolCreatedEvent.parameters.push(
    new ethereum.EventParam("tickSpacing", ethereum.Value.fromI32(tickSpacing))
  )
  poolCreatedEvent.parameters.push(
    new ethereum.EventParam("pool", ethereum.Value.fromAddress(pool))
  )

  return poolCreatedEvent
}

export function createSetFeeProtocolEvent(
  feeProtocolOld: i32,
  feeProtocolNew: i32
): SetFeeProtocol {
  let setFeeProtocolEvent = changetype<SetFeeProtocol>(newMockEvent())

  setFeeProtocolEvent.parameters = new Array()

  setFeeProtocolEvent.parameters.push(
    new ethereum.EventParam(
      "feeProtocolOld",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(feeProtocolOld))
    )
  )
  setFeeProtocolEvent.parameters.push(
    new ethereum.EventParam(
      "feeProtocolNew",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(feeProtocolNew))
    )
  )

  return setFeeProtocolEvent
}

export function createSetPoolFeeProtocolEvent(
  pool: Address,
  feeProtocolOld: i32,
  feeProtocolNew: i32
): SetPoolFeeProtocol {
  let setPoolFeeProtocolEvent = changetype<SetPoolFeeProtocol>(newMockEvent())

  setPoolFeeProtocolEvent.parameters = new Array()

  setPoolFeeProtocolEvent.parameters.push(
    new ethereum.EventParam("pool", ethereum.Value.fromAddress(pool))
  )
  setPoolFeeProtocolEvent.parameters.push(
    new ethereum.EventParam(
      "feeProtocolOld",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(feeProtocolOld))
    )
  )
  setPoolFeeProtocolEvent.parameters.push(
    new ethereum.EventParam(
      "feeProtocolNew",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(feeProtocolNew))
    )
  )

  return setPoolFeeProtocolEvent
}

export function createTickSpacingEnabledEvent(
  tickSpacing: i32,
  fee: i32
): TickSpacingEnabled {
  let tickSpacingEnabledEvent = changetype<TickSpacingEnabled>(newMockEvent())

  tickSpacingEnabledEvent.parameters = new Array()

  tickSpacingEnabledEvent.parameters.push(
    new ethereum.EventParam("tickSpacing", ethereum.Value.fromI32(tickSpacing))
  )
  tickSpacingEnabledEvent.parameters.push(
    new ethereum.EventParam(
      "fee",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(fee))
    )
  )

  return tickSpacingEnabledEvent
}
