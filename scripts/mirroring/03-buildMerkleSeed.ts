import fs from "fs";
import Locks from "./data/locks.json";
import path from "path";

buildSeed()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

async function buildSeed() {
    let seed: string[][] = []

    for (let i = 0; i < Locks.length; i++) {
        let lock = Locks[i]
        seed.push(
            [
                lock.user,
                lock.chain_id.toString(),
                lock.escrow_id.toString(),
                lock.end.toString(),
                lock.amount
            ]
        )
    }

    fs.writeFileSync(path.join(__dirname, "data/mirrors.json"),
        JSON.stringify(seed, null, 4)
    );
}