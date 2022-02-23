
import * as RewardPolicyMakerArtifact from "../../../artifacts/contracts/RewardPolicyMaker.vy/RewardPolicyMaker.json";
import * as GaugeControllerArtifact from "../../../artifacts/contracts/GaugeController.vy/GaugeController.json";
import {GaugeController, RewardPolicyMaker} from "../../../typechain";
import {Contract} from "ethers";
import fs from "fs";
import {Deployment} from "./common/deploy";
import path from "path";
import {patchAbiGasFields} from "../../airdrops/utils/helpers";
import hre, {ethers} from "hardhat";

async function read() {
    const [deployer] = await ethers.getSigners();
    const location = path.join(__dirname, `${hre.hardhatArguments.network}/lendly-deployments.json`);
    let deployments: Deployment = JSON.parse(fs.readFileSync(location).toString());

    if (deployments.RewardPolicyMaker) {
        let rewardPolicyMaker: RewardPolicyMaker =
            <RewardPolicyMaker>new Contract(deployments.RewardPolicyMaker, patchAbiGasFields(RewardPolicyMakerArtifact.abi), deployer);

        console.log("reward policy maker admin", await rewardPolicyMaker.admin());
        const epoch = await rewardPolicyMaker.current_epoch();
        console.log("epoch", epoch.toString());
        console.log("rewards next", (await rewardPolicyMaker.rewards(epoch.toNumber()+1)).toString());
    }

    if (deployments.GaugeController) {
        let gaugeController: GaugeController =
            <GaugeController>new Contract(deployments.GaugeController, patchAbiGasFields(GaugeControllerArtifact.abi), deployer);

        console.log("controller admin", await gaugeController.admin());
        console.log("controller future admin", await gaugeController.future_admin());
    }
}

read();