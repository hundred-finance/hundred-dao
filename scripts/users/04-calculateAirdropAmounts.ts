import fs from "fs";
import Balances from "./balances.json";
import {mapToObj} from "./utils/helpers";

const AirdropAmount = 18750 * 1e18

calculateAirdropAmounts()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

async function calculateAirdropAmounts() {
    let airdropAmounts: Map<string, string> = new Map<string, string>()

    for (let i = 0; i < Balances.length; i++) {
        let amount = Math.round(Balances[i].ve_hnd_share * AirdropAmount)
        if (amount >= (0.1 * 1e18)) {
            airdropAmounts.set(
                Balances[i].user,
                BigInt(Math.round(Balances[i].ve_hnd_share * AirdropAmount)).toString()
            )
        }
    }

    console.log(`Found ${airdropAmounts.size} users`)

    fs.writeFileSync(`./scripts/users/airdrop.json`,
        JSON.stringify(mapToObj(airdropAmounts), null, 4)
    );
}