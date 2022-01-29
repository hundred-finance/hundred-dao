import fs from "fs";
import Balances from "./snapshot.json";
import {mapToObj} from "../utils/helpers";
import path from "path";

const FtmAirdropAmount = 37500 * 1e18
const HndAirdropAmount = 62500 * 1e18

calculateAirdropAmounts()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

async function calculateAirdropAmounts() {
    let airdropAmounts: Map<string, string[]> = new Map<string, string[]>()

    for (let i = 0; i < Balances.length; i++) {
        let ftmAmount = Math.round(Balances[i].share * FtmAirdropAmount)
        let hndAmount = Math.round(Balances[i].share * HndAirdropAmount)
        airdropAmounts.set(
            Balances[i].user,
            [
                BigInt(Math.round(ftmAmount)).toString(),
                BigInt(Math.round(hndAmount)).toString(),
            ]
        )
    }

    fs.writeFileSync(path.join(__dirname, "airdrop.json"),
        JSON.stringify(mapToObj(airdropAmounts), null, 4)
    );
}