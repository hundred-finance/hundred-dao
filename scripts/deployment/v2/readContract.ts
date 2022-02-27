
import * as RewardPolicyMakerArtifact from "../../../artifacts/contracts/RewardPolicyMaker.vy/RewardPolicyMaker.json";
import * as MinterArtifact from "../../../artifacts/contracts/Minter.vy/Minter.json";
import * as TreasuryArtifact from "../../../artifacts/contracts/Treasury.vy/Treasury.json";
import {LiquidityGaugeV41, Minter, RewardPolicyMaker, Treasury} from "../../../typechain";
import {Contract} from "ethers";
import fs from "fs";
import {Deployment} from "./helpers";
import path from "path";
import {patchAbiGasFields} from "../../airdrops/utils/helpers";
import hre, {ethers} from "hardhat";

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

async function read() {
    const [deployer] = await ethers.getSigners();
    const location = path.join(__dirname, `${hre.hardhatArguments.network}/deployments.json`);
    let deployments: Deployment = JSON.parse(fs.readFileSync(location).toString());

    if (deployments.RewardPolicyMaker) {
        let rewardPolicyMaker: RewardPolicyMaker =
            <RewardPolicyMaker>new Contract(deployments.RewardPolicyMaker, patchAbiGasFields(RewardPolicyMakerArtifact.abi), deployer);

        console.log("reward policy maker admin", await rewardPolicyMaker.admin());
        const epoch = await rewardPolicyMaker.current_epoch();
        console.log("epoch", epoch.toString());
        console.log("rewards next", (await rewardPolicyMaker.rewards(epoch.toNumber()+1)).toString());
    }

    if (deployments.Minter) {
        let minter: Minter =
            <Minter>new Contract(deployments.Minter, patchAbiGasFields(MinterArtifact.abi), deployer);

        console.log("minter treasury", await minter.treasury());
    }

    if (deployments.Treasury) {
        let treasury: Treasury =
            <Treasury>new Contract(deployments.Treasury, patchAbiGasFields(TreasuryArtifact.abi), deployer);

        console.log("treasury minter", await treasury.minter());
    }

    if (deployments.Gauges.length > 0) {
        let gauge: LiquidityGaugeV41 =
            <LiquidityGaugeV41>new Contract(deployments.Gauges[0].address, patchAbiGasFields(abi), deployer);


        console.log("claimable amount", (await gauge.claimable_tokens("0x292c6DAE7417B3D31d8B6e1d2EeA0258d14C4C4b")).toString());
    }

}

read();