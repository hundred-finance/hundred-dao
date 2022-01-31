import { ethers } from 'hardhat';
import {
    VotingEscrow__factory,
    VotingEscrow,
    MirroredVotingEscrow__factory,
    MirroredVotingEscrow,
    Treasury__factory,
    Treasury,
    RewardPolicyMaker,
    RewardPolicyMaker__factory,
    GaugeControllerV2__factory,
    GaugeControllerV2,
    LiquidityGaugeV41__factory,
    LiquidityGaugeV41,
    Minter__factory,
    Minter,
    SmartWalletChecker__factory,
    SmartWalletChecker,
    DelegationProxy__factory,
    DelegationProxy,
    VotingEscrowDelegationV2__factory,
    VotingEscrowDelegationV2
} from "../../../../typechain";

import * as GaugeControllerV2Artifact from "../../../../artifacts/contracts/GaugeControllerV2.vy/GaugeControllerV2.json";
import * as VotingEscrowArtifact from "../../../../artifacts/contracts/VotingEscrow.vy/VotingEscrow.json";
import * as MirroredVotingEscrowArtifact from "../../../../artifacts/contracts/MirroredVotingEscrow.vy/MirroredVotingEscrow.json";
import * as RewardPolicyMakerArtifact from "../../../../artifacts/contracts/RewardPolicyMaker.vy/RewardPolicyMaker.json";
import * as TreasuryArtifact from "../../../../artifacts/contracts/Treasury.vy/Treasury.json";
import * as LiquidityGaugeV41Artifact from "../../../../artifacts/contracts/LiquidityGaugeV4_1.vy/LiquidityGaugeV4_1.json";
import * as SmartWalletCheckerArtifact from "../../../../artifacts/contracts/SmartWalletChecker.vy/SmartWalletChecker.json";
import * as DelegationProxyArtifact from "../../../../artifacts/contracts/ve-boost/DelegationProxy.vy/DelegationProxy.json";
import * as VotingEscrowDelegationV2Artifact from "../../../../artifacts/contracts/ve-boost/VotingEscrowDelegationV2.vy/VotingEscrowDelegationV2.json";

import * as fs from "fs";
import {Contract} from "ethers";

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

    const mirroredVotingEscrowFactory: MirroredVotingEscrow__factory =
        <MirroredVotingEscrow__factory>await ethers.getContractFactory("MirroredVotingEscrow");

    const mirroredVotingEscrow = await mirroredVotingEscrowFactory.deploy(deployer.address, votingEscrow.address);
    await mirroredVotingEscrow.deployed();

    deployments.MirroredVotingEscrow = mirroredVotingEscrow.address;

    await deploySmartWalletChecker(deployer.address, deployName, deployments);

    const treasuryFactory: Treasury__factory =
        <Treasury__factory>await ethers.getContractFactory("Treasury");

    const treasury: Treasury = await treasuryFactory.deploy(hnd);
    await treasury.deployed();

    deployments.Treasury = treasury.address;

    const rewardPolicyMakerFactory: RewardPolicyMaker__factory =
        <RewardPolicyMaker__factory> await ethers.getContractFactory("RewardPolicyMaker");

    const rewardPolicyMaker: RewardPolicyMaker = await rewardPolicyMakerFactory.deploy(86400 * 7);
    await rewardPolicyMaker.deployed();

    deployments.RewardPolicyMaker = rewardPolicyMaker.address;

    const gaugeControllerFactory: GaugeControllerV2__factory =
        <GaugeControllerV2__factory>await ethers.getContractFactory("GaugeControllerV2");

    const gaugeController: GaugeControllerV2 = await gaugeControllerFactory.deploy(hnd, mirroredVotingEscrow.address);
    await gaugeController.deployed();

    deployments.GaugeControllerV2 = gaugeController.address;

    const minterFactory: Minter__factory = <Minter__factory>await ethers.getContractFactory("Minter");
    const minter: Minter = await minterFactory.deploy(treasury.address, gaugeController.address);
    await minter.deployed();

    deployments.Minter = minter.address;

    let addMinterTrx = await treasury.set_minter(minter.address);
    await addMinterTrx.wait();

    const veBoostDelegationFactory: VotingEscrowDelegationV2__factory =
        <VotingEscrowDelegationV2__factory>await ethers.getContractFactory("VotingEscrowDelegationV2");

    const veBoostDelegation: VotingEscrowDelegationV2 =
        await veBoostDelegationFactory.deploy("delegated veHND", "dveHND", "", mirroredVotingEscrow.address);
    await veBoostDelegation.deployed();

    deployments.VotingEscrowDelegationV2 = veBoostDelegation.address;

    const delegationProxyFactory: DelegationProxy__factory = <DelegationProxy__factory>await ethers.getContractFactory("DelegationProxy");
    const delegationProxy = await delegationProxyFactory.deploy(veBoostDelegation.address, deployer.address, deployer.address, mirroredVotingEscrow.address);
    await delegationProxy.deployed();

    deployments.DelegationProxy = delegationProxy.address;

    let addGaugeTypeTrx = await gaugeController["add_type(string,uint256)"]("Stables", ethers.utils.parseEther("10"));
    await addGaugeTypeTrx.wait();

    const gaugeV4Factory: LiquidityGaugeV41__factory =
        <LiquidityGaugeV41__factory>await ethers.getContractFactory("LiquidityGaugeV31");

    for (let i = 0; i < pools.length; i++) {
        const pool = pools[i];

        const gauge: LiquidityGaugeV41 = await gaugeV4Factory.deploy(
            pool.token, minter.address, deployer.address, rewardPolicyMaker.address, delegationProxy.address
        );
        await gauge.deployed();
        deployments.Gauges.push({ id: pool.id, address: gauge.address });

        let trx = await gaugeController["add_gauge(address,int128,uint256)"](gauge.address, 0, pool.weight);
        await trx.wait();
    }

    fs.writeFileSync(`./scripts/deployment/${deployName}/deployments.json`, JSON.stringify(deployments, null, 4));
}

export async function transferOwnership(newOwner: string, deployName: string) {
    const [deployer] = await ethers.getSigners();
    let deployments: Deployment = JSON.parse(fs.readFileSync(`./scripts/deployment/${deployName}/deployments.json`).toString());

    if (deployments.GaugeControllerV2) {
        let gaugeController: GaugeControllerV2 =
        <GaugeControllerV2>new Contract(deployments.GaugeControllerV2, patchAbiGasFields(GaugeControllerV2Artifact.abi), deployer);

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

    if (deployments.MirroredVotingEscrow) {
        let votingEscrow: MirroredVotingEscrow =
            <MirroredVotingEscrow>new Contract(deployments.MirroredVotingEscrow, patchAbiGasFields(MirroredVotingEscrowArtifact.abi), deployer);

        let trx = await votingEscrow.set_admin(newOwner);
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

    if (deployments.DelegationProxy) {
        let contract: DelegationProxy =
            <DelegationProxy>new Contract(deployments.DelegationProxy, patchAbiGasFields(DelegationProxyArtifact.abi), deployer);
        let trx = await contract.commit_set_admins(newOwner, newOwner);
        await trx.wait();

        trx = await contract.apply_set_admins();
        await trx.wait();
    }

    if (deployments.VotingEscrowDelegationV2) {
        let contract: VotingEscrowDelegationV2 =
            <VotingEscrowDelegationV2>new Contract(deployments.VotingEscrowDelegationV2, patchAbiGasFields(VotingEscrowDelegationV2Artifact.abi), deployer);
        let trx = await contract.commit_transfer_ownership(newOwner);
        await trx.wait();
    }

    for(let i = 0; i < deployments.Gauges.length; i++) {
        let gauge: LiquidityGaugeV41 =
            <LiquidityGaugeV41>new Contract(deployments.Gauges[i].address, patchAbiGasFields(LiquidityGaugeV41Artifact.abi), deployer);
        let trx = await gauge.commit_transfer_ownership(newOwner);
        await trx.wait();
    }
}

export async function deployNewGauge(
    admin: string, deployName: string, token: string, tokenName: string, type: number = 0, weight: number = 1
) {
    const [deployer] = await ethers.getSigners();
    let deployments: Deployment = JSON.parse(fs.readFileSync(`./scripts/deployment/${deployName}/deployments.json`).toString());

    if (deployments.GaugeControllerV2 && deployments.DelegationProxy && deployments.RewardPolicyMaker && deployments.Minter) {
        let gaugeController: GaugeControllerV2 =
            <GaugeControllerV2>new Contract(deployments.GaugeControllerV2, patchAbiGasFields(GaugeControllerV2Artifact.abi), deployer);

        let delegationProxy: DelegationProxy =
            <DelegationProxy>new Contract(deployments.DelegationProxy, patchAbiGasFields(DelegationProxyArtifact.abi), deployer);

        const gaugeV4Factory: LiquidityGaugeV41__factory =
            <LiquidityGaugeV41__factory>await ethers.getContractFactory("LiquidityGaugeV41");

        const gauge: LiquidityGaugeV41 = await gaugeV4Factory.deploy(
            token, deployments.Minter, admin, deployments.RewardPolicyMaker, delegationProxy.address
        );
        await gauge.deployed();

        deployments.Gauges.push({ id: tokenName, address: gauge.address });

        let trx = await gaugeController["add_gauge(address,int128,uint256)"](gauge.address, type, weight);
        await trx.wait();

        fs.writeFileSync(`./scripts/deployment/${deployName}/deployments.json`, JSON.stringify(deployments, null, 4));
    }
}

export async function registerGauge(
    deployName: string, gaugeAddress: string, type: number = 0, weight: number = 1
) {
    const [deployer] = await ethers.getSigners();
    let deployments: Deployment = JSON.parse(fs.readFileSync(`./scripts/deployment/${deployName}/deployments.json`).toString());

    if (deployments.GaugeControllerV2 && deployments.RewardPolicyMaker && deployments.Minter) {
        let gaugeController: GaugeControllerV2 =
            <GaugeControllerV2>new Contract(deployments.GaugeControllerV2, patchAbiGasFields(GaugeControllerV2Artifact.abi), deployer);

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
            fs.writeFileSync(`./scripts/deployment/${deployName}/deployments.json`, JSON.stringify(deployments, null, 4));
        }
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
    MirroredVotingEscrow?: string
    GaugeControllerV2?: string
    Treasury?: string
    RewardPolicyMaker?: string
    SmartWalletChecker?: string
    Minter?: string
    DelegationProxy?: string
    VotingEscrowDelegationV2?: string
}