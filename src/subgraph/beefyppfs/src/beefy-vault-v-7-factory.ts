import { ProxyCreated as ProxyCreatedEvent } from "../generated/BeefyVaultV7Factory/BeefyVaultV7Factory";
import { ProxyCreated, Vault } from "../generated/schema";
import { BeefyVault } from "../generated/templates";
import { BeefyVault as BeefyVaultContract } from "../generated/templates/BeefyVault/BeefyVault";
import { BigInt, Address } from "@graphprotocol/graph-ts";

export function handleProxyCreated(event: ProxyCreatedEvent): void {
  // Create ProxyCreated entity
  let proxyCreatedId = event.transaction.hash.concatI32(event.logIndex.toI32());
  let proxyCreated = new ProxyCreated(proxyCreatedId);
  
  proxyCreated.proxy = event.params.proxy;
  proxyCreated.blockNumber = event.block.number;
  proxyCreated.blockTimestamp = event.block.timestamp;
  proxyCreated.transactionHash = event.transaction.hash;
  
  // Create and initialize vault entity
  let vaultId = event.params.proxy;
  let vault = new Vault(vaultId);
  
  vault.address = event.params.proxy;
  vault.totalSupply = BigInt.fromI32(0);
  vault.pricePerFullShare = BigInt.fromI32(0);
  vault.balance = BigInt.fromI32(0);
  vault.createdAt = proxyCreatedId;
  
  // Try to fetch vault details from the contract
  let vaultContract = BeefyVaultContract.bind(event.params.proxy);
  
  let nameResult = vaultContract.try_name();
  if (!nameResult.reverted) {
    vault.name = nameResult.value;
  }
  
  let symbolResult = vaultContract.try_symbol();
  if (!symbolResult.reverted) {
    vault.symbol = symbolResult.value;
  }
  
  let decimalsResult = vaultContract.try_decimals();
  if (!decimalsResult.reverted) {
    vault.decimals = decimalsResult.value;
  }
  
  let strategyResult = vaultContract.try_strategy();
  if (!strategyResult.reverted) {
    vault.strategy = strategyResult.value;
  }
  
  // Create a new template instance to track this vault
  BeefyVault.create(event.params.proxy);
  
  // Save entities
  proxyCreated.vault = vaultId;
  proxyCreated.save();
  vault.save();
}