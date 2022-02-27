
import * as RewardPolicyMakerArtifact from "../../../artifacts/contracts/RewardPolicyMaker.vy/RewardPolicyMaker.json";
import * as GaugeControllerArtifact from "../../../artifacts/contracts/GaugeController.vy/GaugeController.json";
import * as LiquidityGaugeV3Artifact from "../../../artifacts/contracts/LiquidityGaugeV3_1.vy/LiquidityGaugeV3_1.json";
import * as TreasuryArtifact from "../../../artifacts/contracts/Treasury.vy/Treasury.json";
import * as MinterArtifact from "../../../artifacts/contracts/Minter.vy/Minter.json";
import {GaugeController, LiquidityGaugeV31, Minter, RewardPolicyMaker, Treasury} from "../../../typechain";
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
        console.log("rewards next", (await rewardPolicyMaker.rewards(epoch.toNumber())).toString());
    }

    if (deployments.Minter) {
        let minter: Minter =
            <Minter>new Contract(deployments.Minter, patchAbiGasFields(MinterArtifact.abi), deployer);

        console.log("minter controller", await minter.controller());
        console.log("minter treasury", await minter.treasury());
    }

    if (deployments.Treasury) {
        let treasury: Treasury =
            <Treasury>new Contract(deployments.Treasury, patchAbiGasFields(TreasuryArtifact.abi), deployer);

        console.log("treasury admin", await treasury.admin());
        console.log("treasury minter", await treasury.minter());
    }

    if (deployments.GaugeController) {
        let gaugeController: GaugeController =
            <GaugeController>new Contract(deployments.GaugeController, patchAbiGasFields(GaugeControllerArtifact.abi), deployer);

        console.log("controller admin", await gaugeController.admin());
        console.log("controller future admin", await gaugeController.future_admin());

        if (deployments.Gauges.length > 0) {

            let gaugeV31: LiquidityGaugeV31 =
                <LiquidityGaugeV31>new Contract(deployments.Gauges[0].address, patchAbiGasFields(LiquidityGaugeV3Artifact.abi), deployer);

            console.log("gauge controller", (await gaugeV31.controller()).toString());
            console.log("gauge policy", (await gaugeV31.reward_policy_maker()).toString());
            console.log("gauge admin", (await gaugeV31.admin()).toString());
        }
    }


}

read();