### How to create subgraph for Shadow Pool (Sonic mainnet)

1. Install NodeJS 23 and graph cli:

https://nodejs.org/en/download

```shell
npm install -g @graphprotocol/graph-cli@0.96.0
```
2. Check installed versions:
```shell
❯ node -v
v23.3.0

❯ graph -v
@graphprotocol/graph-cli/0.96.0 darwin-arm64 node-v23.3.0
```
3. Create new subgraph in Subgraph Studio. Let's use the name "sonic-shadow".
https://thegraph.com/studio/

4. Follow instructions:
```shell
graph init sonic-shadow
```

Follow instructions:
```shell
type "sonic", select Sonic Mainnet · sonic
Source ❯ Smart contract · default
Subgraph slug › sonic-shadow
Directory to create the subgraph in › sonic-shadow
Contract address › 0x6Fb30F3FCB864D49cdff15061ed5c6ADFEE40B40

 Fetching ABI from contract API...
✔ Fetching start block from contract API...
✔ Fetching contract name from contract API...
? Start block › 1949593

Contract name › RamsesV3Poo
Index contract events as entities (Y/n) › true
Add another contract? (y/N) · false
```

5. Publish sugraph to Graph network
```shell
cd sonic-shadow

graph auth <deploy key>

graph codegen && graph build

graph deploy sonic-shadow
```

```shell
Deployed to https://thegraph.com/studio/subgraph/sonic-shadow

Subgraph endpoints:
Queries (HTTP):     https://api.studio.thegraph.com/query/91182/sonic-shadow/v0.0.1
```

6. Open the subgraph studio dashboard and check sync status
https://thegraph.com/studio/subgraph/sonic-shadow/playground
