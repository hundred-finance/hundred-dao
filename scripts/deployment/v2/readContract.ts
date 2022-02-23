
import * as RewardPolicyMakerArtifact from "../../../artifacts/contracts/RewardPolicyMaker.vy/RewardPolicyMaker.json";
import {RewardPolicyMaker} from "../../../typechain";
import {Contract} from "ethers";
import fs from "fs";
import {Deployment} from "./helpers";
import path from "path";
import {patchAbiGasFields} from "../../airdrops/utils/helpers";
import hre, {ethers} from "hardhat";

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
}

read();