# Tools for inspecting veHND usage

generate user locks on a given chain as the following:

```shell
npx hardhat run ./scripts/users/extractLocks.ts --network harmony 
```
this will generate a file like [harmony-locks.json](./scripts/users/snapshots/harmony-locks.json)

generate veHND balances at latest snapshot timestamp with non 0 share
```shell
npx ts-node scripts/users/calculateBalances.ts --network harmony 
```

result will be put in [harmony.json](./scripts/users/balances/harmony.json)

Finally to generate list of cross chain users with overall balances

```shell
npx ts-node scripts/users/calculateVotingShares.ts
```

result will be put in [balances.json](./scripts/users/balances.json)