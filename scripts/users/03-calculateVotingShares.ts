import fs from "fs";
import FantomBalances from "./balances/fantom.json";
import HarmonyBalances from "./balances/harmony.json";
import ArbitrumBalances from "./balances/arbitrum.json";

calculateVotingShares()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

async function calculateVotingShares() {
    let votingShares: Array<UserShare> = []
    let balances = [...FantomBalances, ...HarmonyBalances, ...ArbitrumBalances]
    let totalVeHnd = balances.map(b => parseInt(b.balance)).reduce((a, b) => a + b)

    for (let i = 0 ; i < balances.length; i++) {
        let balance = balances[i]
        let currentShare = votingShares.find(v => v.user === balance.user)
        if (currentShare) {
            currentShare.ve_hnd_balance = (+currentShare.ve_hnd_balance + +balance.balance).toFixed()
            currentShare.ve_hnd_share = +currentShare.ve_hnd_balance / totalVeHnd
        } else if (+balance.balance > 0) {
            votingShares.push({
                user: balance.user,
                ve_hnd_balance: balance.balance,
                ve_hnd_share: +balance.balance / totalVeHnd
            })
        }
    }

    console.log(`Found ${votingShares.length} users`)

    fs.writeFileSync(`./scripts/users/balances.json`,
        JSON.stringify(
            votingShares.sort((a, b) => +b.ve_hnd_balance - +a.ve_hnd_balance),
            null, 4
        )
    );
}

interface UserShare {
    user: string
    ve_hnd_balance: string
    ve_hnd_share: number
}