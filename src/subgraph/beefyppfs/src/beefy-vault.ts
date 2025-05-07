import { Transfer as TransferEvent } from "../generated/templates/BeefyVault/BeefyVault";
import { BeefyVault as BeefyVaultContract } from "../generated/templates/BeefyVault/BeefyVault";
import { Vault, User, UserVaultBalance, Transaction } from "../generated/schema";
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";

function getOrCreateUser(address: Address): User {
  let userId = address;
  let user = User.load(userId);
  
  if (!user) {
    user = new User(userId);
    user.address = address;
    user.save();
  }
  
  return user;
}

function getOrCreateUserVaultBalance(userAddress: Address, vaultAddress: Address): UserVaultBalance {
  let id = userAddress.concat(vaultAddress);
  let balance = UserVaultBalance.load(id);
  
  if (!balance) {
    balance = new UserVaultBalance(id);
    balance.user = userAddress;
    balance.vault = vaultAddress;
    balance.balance = BigInt.fromI32(0);
    balance.updatedAtBlock = BigInt.fromI32(0);
    balance.updatedAtTimestamp = BigInt.fromI32(0);
    balance.save();
  }
  
  return balance;
}

export function handleTransfer(event: TransferEvent): void {
  let vaultAddress = event.address;
  let vault = Vault.load(vaultAddress);
  
  if (!vault) {
    return; // Vault should already exist from factory event
  }
  
  // Update vault data
  let vaultContract = BeefyVaultContract.bind(vaultAddress);
  
  let totalSupplyResult = vaultContract.try_totalSupply();
  if (!totalSupplyResult.reverted) {
    vault.totalSupply = totalSupplyResult.value;
  }
  
  let pricePerFullShareResult = vaultContract.try_getPricePerFullShare();
  if (!pricePerFullShareResult.reverted) {
    vault.pricePerFullShare = pricePerFullShareResult.value;
  }
  
  let balanceResult = vaultContract.try_balance();
  if (!balanceResult.reverted) {
    vault.balance = balanceResult.value;
  }
  
  vault.save();
  
  // Process transfer
  let from = event.params.from;
  let to = event.params.to;
  let value = event.params.value;
  
  // Determine transaction type
  let txType = "transfer";
  let zeroAddress = Address.fromString("0x0000000000000000000000000000000000000000");
  let burnAddress = Address.fromString("0x000000000000000000000000000000000000dead");
  
  if (from.equals(zeroAddress)) {
    txType = "mint";
  } else if (to.equals(zeroAddress) || to.equals(burnAddress)) {
    txType = "burn";
  } else if (from.equals(vaultAddress)) {
    txType = "deposit";
  } else if (to.equals(vaultAddress)) {
    txType = "withdraw";
  }
  
  // Update balances and create transactions
  if (!from.equals(zeroAddress)) {
    let fromUser = getOrCreateUser(from);
    let fromBalance = getOrCreateUserVaultBalance(from, vaultAddress);
    
    // Update balance
    fromBalance.balance = fromBalance.balance.minus(value);
    fromBalance.updatedAtBlock = event.block.number;
    fromBalance.updatedAtTimestamp = event.block.timestamp;
    fromBalance.save();
    
    // Create transaction
    let fromTxId = event.transaction.hash.concat(Bytes.fromI32(event.logIndex.toI32())).concat(Bytes.fromUTF8("from"));
    let fromTx = new Transaction(fromTxId);
    fromTx.hash = event.transaction.hash;
    fromTx.user = fromUser.id;
    fromTx.vault = vault.id;
    fromTx.type = txType === "transfer" ? "send" : txType;
    fromTx.amount = value;
    fromTx.blockNumber = event.block.number;
    fromTx.timestamp = event.block.timestamp;
    fromTx.save();
  }
  
  if (!to.equals(zeroAddress) && !to.equals(burnAddress)) {
    let toUser = getOrCreateUser(to);
    let toBalance = getOrCreateUserVaultBalance(to, vaultAddress);
    
    // Update balance
    toBalance.balance = toBalance.balance.plus(value);
    toBalance.updatedAtBlock = event.block.number;
    toBalance.updatedAtTimestamp = event.block.timestamp;
    toBalance.save();
    
    // Create transaction
    let toTxId = event.transaction.hash.concat(Bytes.fromI32(event.logIndex.toI32())).concat(Bytes.fromUTF8("to"));
    let toTx = new Transaction(toTxId);
    toTx.hash = event.transaction.hash;
    toTx.user = toUser.id;
    toTx.vault = vault.id;
    toTx.type = txType === "transfer" ? "receive" : txType;
    toTx.amount = value;
    toTx.blockNumber = event.block.number;
    toTx.timestamp = event.block.timestamp;
    toTx.save();
  }
}