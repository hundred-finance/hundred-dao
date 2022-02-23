import { ethers } from 'hardhat';
import {
    VotingEscrow__factory,
    VotingEscrow,
    Treasury__factory,
    Treasury,
    RewardPolicyMaker,
    RewardPolicyMaker__factory,
    GaugeController__factory,
    GaugeController,
    Minter__factory,
    Minter, LiquidityGaugeV31__factory, LiquidityGaugeV31, SmartWalletChecker__factory, SmartWalletChecker
} from "../../../../typechain";

import * as GaugeControllerArtifact from "../../../../artifacts/contracts/GaugeController.vy/GaugeController.json";
import * as VotingEscrowArtifact from "../../../../artifacts/contracts/VotingEscrow.vy/VotingEscrow.json";
import * as RewardPolicyMakerArtifact from "../../../../artifacts/contracts/RewardPolicyMaker.vy/RewardPolicyMaker.json";
import * as TreasuryArtifact from "../../../../artifacts/contracts/Treasury.vy/Treasury.json";
import * as LiquidityGaugeV31Artifact from "../../../../artifacts/contracts/LiquidityGaugeV3_1.vy/LiquidityGaugeV3_1.json";
import * as SmartWalletCheckerArtifact from "../../../../artifacts/contracts/SmartWalletChecker.vy/SmartWalletChecker.json";

import * as fs from "fs";
import {BigNumber, BigNumberish, Contract} from "ethers";

export async function deploy(hnd: string, pools: any[], deployName: string) {

    let deployments: Deployment = {
        Gauges: []
    };
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const votingEscrowFactory: VotingEscrow__factory =
        <VotingEscrow__factory>await ethers.getContractFactory("VotingEscrow");

    const votingEscrow = await votingEscrowFactory.deploy(
        hnd,
        "Vote-escrowed HND",
        "veHND",
        "veHND_1.0.0"
    );
    await votingEscrow.deployed();

    deployments.VotingEscrow = votingEscrow.address;

    await deploySmartWalletChecker(deployer.address, deployName, deployments);

    const treasuryFactory: Treasury__factory =
        <Treasury__factory>await ethers.getContractFactory("Treasury");

    const treasury: Treasury = await treasuryFactory.deploy(hnd, deployer.address);
    await treasury.deployed();

    deployments.Treasury = treasury.address;

    const rewardPolicyMakerFactory: RewardPolicyMaker__factory =
        <RewardPolicyMaker__factory> await ethers.getContractFactory("RewardPolicyMaker");

    const rewardPolicyMaker: RewardPolicyMaker = await rewardPolicyMakerFactory.deploy(86400 * 7, deployer.address);
    await rewardPolicyMaker.deployed();

    deployments.RewardPolicyMaker = rewardPolicyMaker.address;

    const gaugeControllerFactory: GaugeController__factory =
        <GaugeController__factory>await ethers.getContractFactory("GaugeController");

    const gaugeController: GaugeController = await gaugeControllerFactory.deploy(hnd, votingEscrow.address);
    await gaugeController.deployed();

    deployments.GaugeController = gaugeController.address;

    const minterFactory: Minter__factory = <Minter__factory>await ethers.getContractFactory("Minter");
    const minter: Minter = await minterFactory.deploy(treasury.address, gaugeController.address);
    await minter.deployed();

    deployments.Minter = minter.address;

    let addMinterTrx = await treasury.set_minter(minter.address);
    await addMinterTrx.wait();

    let addGaugeTypeTrx = await gaugeController["add_type(string,uint256)"]("Stables", ethers.utils.parseEther("10"));
    await addGaugeTypeTrx.wait();

    const gaugeV4Factory: LiquidityGaugeV31__factory =
        <LiquidityGaugeV31__factory>await ethers.getContractFactory("LiquidityGaugeV3_1");

    for (let i = 0; i < pools.length; i++) {
        const pool = pools[i];

        const gauge: LiquidityGaugeV31 = await gaugeV4Factory.deploy(
            pool.token, minter.address, deployer.address, rewardPolicyMaker.address
        );
        await gauge.deployed();
        deployments.Gauges.push({ id: pool.id, address: gauge.address });

        let trx = await gaugeController["add_gauge(address,int128,uint256)"](gauge.address, 0, pool.weight);
        await trx.wait();
    }

    fs.writeFileSync(`./scripts/deployment/v1/${deployName}/deployments.json`, JSON.stringify(deployments, null, 4));
}

export async function transferOwnership(newOwner: string, deployName: string) {
    const [deployer] = await ethers.getSigners();
    let deployments: Deployment = JSON.parse(fs.readFileSync(`./scripts/deployment/v1/${deployName}/deployments.json`).toString());

    if (deployments.GaugeController) {
        let gaugeController: GaugeController =
        <GaugeController>new Contract(deployments.GaugeController, patchAbiGasFields(GaugeControllerArtifact.abi), deployer);

        let trx = await gaugeController.commit_transfer_ownership(newOwner);
        await trx.wait();

        trx = await gaugeController.apply_transfer_ownership();
        await trx.wait();
    }

    if (deployments.SmartWalletChecker) {
        let checker: SmartWalletChecker =
            <SmartWalletChecker>new Contract(deployments.SmartWalletChecker, patchAbiGasFields(SmartWalletCheckerArtifact.abi), deployer);

        let trx = await checker.set_admin(newOwner);
        await trx.wait();
    }

    if (deployments.VotingEscrow) {
        let votingEscrow: VotingEscrow =
            <VotingEscrow>new Contract(deployments.VotingEscrow, patchAbiGasFields(VotingEscrowArtifact.abi), deployer);

        let trx = await votingEscrow.commit_transfer_ownership(newOwner);
        await trx.wait();

        trx = await votingEscrow.apply_transfer_ownership();
        await trx.wait();
    }

    if (deployments.RewardPolicyMaker) {
        let rewardPolicyMaker: RewardPolicyMaker =
            <RewardPolicyMaker>new Contract(deployments.RewardPolicyMaker, patchAbiGasFields(RewardPolicyMakerArtifact.abi), deployer);

        let trx = await rewardPolicyMaker.set_admin(newOwner);
        await trx.wait();
    }

    if (deployments.Treasury) {
        let treasury: Treasury = <Treasury>new Contract(deployments.Treasury, patchAbiGasFields(TreasuryArtifact.abi), deployer);
        let trx = await treasury.set_admin(newOwner);
        await trx.wait();
    }

    for(let i = 0; i < deployments.Gauges.length; i++) {
        let gauge: LiquidityGaugeV31 =
            <LiquidityGaugeV31>new Contract(deployments.Gauges[i].address, patchAbiGasFields(LiquidityGaugeV31Artifact.abi), deployer);
        let trx = await gauge.commit_transfer_ownership(newOwner);
        await trx.wait();
    }
}

export async function acceptOwnership(deployName: string) {
    const [deployer] = await ethers.getSigners();
    let deployments: Deployment = JSON.parse(fs.readFileSync(`./scripts/deployment/v1/${deployName}/deployments.json`).toString());

    for(let i = 0; i < deployments.Gauges.length; i++) {
        let gauge: LiquidityGaugeV31 =
            <LiquidityGaugeV31>new Contract(deployments.Gauges[i].address, patchAbiGasFields(LiquidityGaugeV31Artifact.abi), deployer);
        let trx = await gauge.accept_transfer_ownership();
        await trx.wait();
    }
}

export async function deployNewGauge(
    admin: string, deployName: string, token: string, tokenName: string, type: number = 0, weight: number = 1
) {
    let deployments: Deployment = JSON.parse(fs.readFileSync(`./scripts/deployment/v1/${deployName}/deployments.json`).toString());

    if (deployments.GaugeController && deployments.RewardPolicyMaker && deployments.Minter) {

        const gaugeV4Factory: LiquidityGaugeV31__factory =
            <LiquidityGaugeV31__factory>await ethers.getContractFactory("LiquidityGaugeV3_1");

        const gauge: LiquidityGaugeV31 = await gaugeV4Factory.deploy(
            token, deployments.Minter, admin, deployments.RewardPolicyMaker
        );
        await gauge.deployed();

        deployments.Gauges.push({ id: tokenName, address: gauge.address });

        fs.writeFileSync(`./scripts/deployment/v1/${deployName}/deployments.json`, JSON.stringify(deployments, null, 4));
    }
}

export async function registerGauge(
    deployName: string, gaugeAddress: string, type: number = 0, weight: number = 1
) {
    const [deployer] = await ethers.getSigners();
    let deployments: Deployment = JSON.parse(fs.readFileSync(`./scripts/deployment/v1/${deployName}/deployments.json`).toString());

    if (deployments.GaugeController && deployments.RewardPolicyMaker && deployments.Minter) {
        let gaugeController: GaugeController =
            <GaugeController>new Contract(deployments.GaugeController, patchAbiGasFields(GaugeControllerArtifact.abi), deployer);

        let trx = await gaugeController["add_gauge(address,int128,uint256)"](gaugeAddress, type, weight);
        await trx.wait();
    }
}

export async function deploySmartWalletChecker(
    admin: string, deployName: string, deployments: Deployment,
    linkToEscrow: boolean = true, updateDeployment: boolean = false
) {
    const [deployer] = await ethers.getSigners();
    if (deployments.VotingEscrow) {
        const smartWalletChecker: SmartWalletChecker__factory =
            <SmartWalletChecker__factory>await ethers.getContractFactory("SmartWalletChecker");

        const checker: SmartWalletChecker = await smartWalletChecker.deploy(admin);
        await checker.deployed();

        deployments.SmartWalletChecker = checker.address;

        if (linkToEscrow) {
            let votingEscrow: VotingEscrow =
                <VotingEscrow>new Contract(deployments.VotingEscrow, patchAbiGasFields(VotingEscrowArtifact.abi), deployer);

            let trx = await votingEscrow.commit_smart_wallet_checker(checker.address);
            await trx.wait();
        }

        if (updateDeployment) {
            fs.writeFileSync(`./scripts/deployment/v1/${deployName}/deployments.json`, JSON.stringify(deployments, null, 4));
        }
    }
}

export async function setRewardsStartingAt(deployName: string, startEpoch: number, rewards: [BigNumber, BigNumber, BigNumber, BigNumber, BigNumber, BigNumber, BigNumber, BigNumber, BigNumber, BigNumber]) {
    const [deployer] = await ethers.getSigners();
    let deployments: Deployment = JSON.parse(fs.readFileSync(`./scripts/deployment/v1/${deployName}/deployments.json`).toString());

    if (deployments.RewardPolicyMaker) {
        let rewardPolicyMaker: RewardPolicyMaker =
            <RewardPolicyMaker>new Contract(
                deployments.RewardPolicyMaker,
                patchAbiGasFields(RewardPolicyMakerArtifact.abi),
                deployer
            );

        let trx = await rewardPolicyMaker.set_rewards_starting_at(startEpoch, rewards);
        await trx.wait();
    }

}

function patchAbiGasFields(abi: any[]) {
    for(let i = 0; i < abi.length; i++) {
        abi[i].gas = undefined
    }
    return abi
}

export interface Deployment {
    Gauges: Array<{id: string, address: string}>
    VotingEscrow?: string
    GaugeController?: string
    Treasury?: string
    RewardPolicyMaker?: string
    SmartWalletChecker?: string
    Minter?: string
}