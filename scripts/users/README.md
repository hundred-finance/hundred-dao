# Tools for inspecting veHND usage

generate user locks on a given chain as the following:

```shell
npx hardhat run ./scripts/users/01-extractLocks.ts --network harmony 
```
this will generate a file like [harmony-locks.json](./scripts/users/snapshots/harmony-snapshot-1.json)

generate veHND balances at latest snapshot timestamp with non 0 share
```shell
npx hardhat run scripts/users/02-calculateBalances.ts --network harmony 
```

result will be put in [harmony.json](./scripts/users/balances/harmony-snapshot-1.json)

Finally to generate list of cross chain users with overall balances

```shell
npx ts-node scripts/users/03-calculateVotingShares.ts
```

result will be put in [balances.json](./scripts/users/balances-snapshot-1.json)

```shell
npx ts-node scripts/users/04-calculateAirdropAmounts.ts
```

will create a exact amounts in [airdrop.json](./scripts/users/airdrop-snapshot-1.json)

```shell
npx ts-node scripts/users/05-generateMerkleTree.ts
```

will create the full merkle tree in [merkleTree.json](./scripts/users/merkleTree-snapshot-1.json)

```shell
npx ts-node scripts/users/06-deployMerkleClaim.ts
```

will deploy the Claim contract using the merkle tree file. Only works on fantom
and will use `WFTM` as claim token

## Credits

Merkle airdrop was based on the work of [Anish-Agnihotri](https://github.com/Anish-Agnihotri/merkle-airdrop-starter)