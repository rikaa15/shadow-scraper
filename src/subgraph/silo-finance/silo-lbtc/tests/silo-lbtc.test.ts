import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { handleDeposit } from "../src/silo-lbtc"
import { createDepositEvent } from "./silo-lbtc-utils"

describe("VaultDeposit entity test", () => {
  beforeAll(() => {
    let sender = Address.fromString("0x000000000000000000000000000000000000dead")
    let owner = Address.fromString("0x000000000000000000000000000000000000cafe")
    let assets = BigInt.fromI32(1000)
    let shares = BigInt.fromI32(900)

    let event = createDepositEvent(sender, owner, assets, shares)
    handleDeposit(event)
  })

  afterAll(() => {
    clearStore()
  })

  test("Deposit should be saved correctly", () => {
    assert.entityCount("VaultDeposit", 1)

    assert.fieldEquals(
      "VaultDeposit",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "user",
      "0x000000000000000000000000000000000000dead"
    )

    assert.fieldEquals(
      "VaultDeposit",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "silo",
      "0x000000000000000000000000000000000000cafe"
    )

    assert.fieldEquals(
      "VaultDeposit",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "amount",
      "1000"
    )

    assert.fieldEquals(
      "VaultDeposit",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "shares",
      "900"
    )
  })
})
