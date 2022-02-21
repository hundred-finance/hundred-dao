import { ethers } from 'hardhat';
import {
    LiquidityGaugeV41,
} from "../../../typechain";

import * as fs from "fs";
import {Contract} from "ethers";
import {getChainName, patchAbiGasFields} from "../utils/helpers";
import path from "path";

const GAUGES = [
    {
        "id": "hUSDC",
        "address": "0xb4BAfc3d60662De362c0cB0f5e2DE76603Ea77D7"
    },
    {
        "id": "hUSDT",
        "address": "0x6BFD171dDEF7ef775E6C1d6078C10198229DD242"
    },
    {
        "id": "hMIM",
        "address": "0xF191d17dEe9943F06bB784C0492805280AeE0bf9"
    },
    {
        "id": "hFRAX",
        "address": "0x61F95b38f880a6C5A4b7DD15560D7bB8B3E36f35"
    }
];

extractClaim()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

const abi = [
    {
        "stateMutability": "view",
        "type": "function",
        "name": "claimable_tokens",
        "inputs": [
            {
                "name": "addr",
                "type": "address"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ]
    }
]

export async function extractClaim() {

    const claims: any[] = [];
    const [deployer] = await ethers.getSigners();
    const chainName = getChainName(await deployer.getChainId());

    let accounts: Array<string> = JSON.parse(fs.readFileSync(path.join(__dirname, `accounts.json`)).toString());

    for(let j = 0; j < accounts.length; j++) {
        for(let i = 0; i < GAUGES.length; i++) {

            let gauge: LiquidityGaugeV41 =
            <LiquidityGaugeV41>new Contract(GAUGES[i].address, patchAbiGasFields(abi), deployer);

            const userClaim = claims.find(c => c.address === accounts[j]);
            let claim = await gauge.claimable_tokens(accounts[j]);
            if (claim.toString() !== "0") {
                if (userClaim === undefined) {
                    claims.push({
                        address: accounts[j],
                        amount: BigInt(claim.toString()).toString()
                    })
                } else {
                    userClaim.amount = (BigInt(userClaim.amount) + BigInt(claim.toString())).toString()
                }
            }
        }
    }

    fs.writeFileSync(path.join(__dirname, `hnd_claims_${chainName}.json` ), JSON.stringify(claims, null, 4));
}