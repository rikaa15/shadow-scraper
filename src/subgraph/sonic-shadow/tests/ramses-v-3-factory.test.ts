import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address } from "@graphprotocol/graph-ts"
import { FeeAdjustment } from "../generated/schema"
import { FeeAdjustment as FeeAdjustmentEvent } from "../generated/RamsesV3Factory/RamsesV3Factory"
import { handleFeeAdjustment } from "../src/ramses-v-3-factory"
import { createFeeAdjustmentEvent } from "./ramses-v-3-factory-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let pool = Address.fromString("0x0000000000000000000000000000000000000001")
    let newFee = 123
    let newFeeAdjustmentEvent = createFeeAdjustmentEvent(pool, newFee)
    handleFeeAdjustment(newFeeAdjustmentEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("FeeAdjustment created and stored", () => {
    assert.entityCount("FeeAdjustment", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "FeeAdjustment",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "pool",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "FeeAdjustment",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "newFee",
      "123"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
