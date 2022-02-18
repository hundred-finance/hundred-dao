import { ethers } from 'hardhat';
import {
    LiquidityGaugeV41,
} from "../../../typechain";

import * as fs from "fs";
import {Contract} from "ethers";
import {Deployment, getChainName, patchAbiGasFields} from "../utils/helpers";
import path from "path";

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

    let deployments: Deployment = JSON.parse(fs.readFileSync(path.join(__dirname, `../../deployment/v2/${chainName}-deployments.json`)).toString());
    let accounts: Array<string> = JSON.parse(fs.readFileSync(path.join(__dirname, `accounts.json`)).toString());

    for(let i = 0; i < deployments.Gauges.length; i++) {
        let gauge: LiquidityGaugeV41 =
            <LiquidityGaugeV41>new Contract(deployments.Gauges[i].address, patchAbiGasFields(abi), deployer);

        for(let j = 0; j < accounts.length; j++) {
            if (claims.find(c => c.address === accounts[j]) === undefined) {
                let claim = await gauge.claimable_tokens(accounts[j]);
                if (claim.toString() !== "0") {
                    claims.push({
                        address: accounts[j],
                        amount: claim.toString()
                    })
                }
            }
        }
    }

    fs.writeFileSync(path.join(__dirname, `hnd_claims_${chainName}.json` ), JSON.stringify(claims, null, 4));
}