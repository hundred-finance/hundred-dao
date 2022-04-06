import hre, { ethers } from 'hardhat';
import {
    VotingEscrowV2__factory,
    VotingEscrowV2,
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
    VotingEscrowDelegationV2, VotingEscrow,
    MirrorGate__factory, MirrorGate, HundredBond__factory, HundredBond
} from "../../../typechain";

import * as VotingEscrowV1Artifact from "../../../artifacts/contracts/VotingEscrow.vy/VotingEscrow.json";
import * as VotingEscrowV2Artifact from "../../../artifacts/contracts/VotingEscrowV2.vy/VotingEscrowV2.json";
import * as DelegationProxyArtifact from "../../../artifacts/contracts/ve-boost/DelegationProxy.vy/DelegationProxy.json";

import * as fs from "fs";
import {Contract} from "ethers";
import path from "path";
import {boolean} from "hardhat/internal/core/params/argumentTypes";

export async function deploy(
    hnd: string,
    pools: any[],
    network: string,
    admin: string,
    flavour: string = "deployments",
    layerZeroEndpoint: string = ""
) {
    let deployments: Deployment = {
        Gauges: []
    };
    const [deployer] = await ethers.getSigners();
    const location = path.join(__dirname, `/${network}/${flavour}.json`);

    try {
        deployments = JSON.parse(fs.readFileSync(location).toString());
    } catch (e) {}

    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    if (!deployments.VotingEscrowV1 && !deployments.VotingEscrowV2) {
        await deploySmartWalletChecker(admin, deployments);
        await deployLockCreatorChecker(admin, deployments);

        if (deployments.SmartWalletChecker && deployments.LockCreatorChecker) {
            const votingEscrowFactory: VotingEscrowV2__factory =
                <VotingEscrowV2__factory>await ethers.getContractFactory("VotingEscrowV2");

            const votingEscrow = await votingEscrowFactory.deploy(
                hnd,
                "Vote-escrowed HND",
                "veHND",
                "veHND_1.0.0",
                admin,
                deployments.SmartWalletChecker,
                deployments.LockCreatorChecker
            );
            await votingEscrow.deployed();

            deployments.VotingEscrowV2 = votingEscrow.address;
            console.log("Deployed veHND: ", votingEscrow.address);
        }
    }

    if (!deployments.MirroredVotingEscrow) {
        const mirroredVotingEscrowFactory: MirroredVotingEscrow__factory =
            <MirroredVotingEscrow__factory>await ethers.getContractFactory("MirroredVotingEscrow");

        const mirroredVotingEscrow = await mirroredVotingEscrowFactory.deploy(
            admin,
            deployments.VotingEscrowV2 ? deployments.VotingEscrowV2 : (deployments.VotingEscrowV1 ? deployments.VotingEscrowV1 : ""),
            "Mirrored Vote-escrowed HND",
            "mveHND",
            "mveHND_1.0.0"
        );
        await mirroredVotingEscrow.deployed();

        deployments.MirroredVotingEscrow = mirroredVotingEscrow.address;
        console.log("Deployed mveHND: ", mirroredVotingEscrow.address);
    }

    if (deployments.VotingEscrowV1 && !deployments.SmartWalletChecker) {
        let votingEscrow: VotingEscrow =
            <VotingEscrow>new Contract(deployments.VotingEscrowV1, patchAbiGasFields(VotingEscrowV1Artifact.abi), deployer);

        const addr = await votingEscrow.smart_wallet_checker();
        if (addr && addr != "0x0000000000000000000000000000000000000000") {
            deployments.SmartWalletChecker = await votingEscrow.smart_wallet_checker();
        }
    } else if (deployments.VotingEscrowV2) {
        let votingEscrow: VotingEscrowV2 =
            <VotingEscrowV2>new Contract(deployments.VotingEscrowV2, patchAbiGasFields(VotingEscrowV2Artifact.abi), deployer);

        deployments.SmartWalletChecker = await votingEscrow.smart_wallet_checker();
        deployments.LockCreatorChecker = await votingEscrow.lock_creator_checker();
    }

    if (!deployments.Treasury) {
        const treasuryFactory: Treasury__factory =
            <Treasury__factory>await ethers.getContractFactory("Treasury");

        const treasury: Treasury = await treasuryFactory.deploy(hnd, admin);
        await treasury.deployed();

        deployments.Treasury = treasury.address;
        console.log("Deployed Treasury: ", treasury.address);
    }

    if (!deployments.RewardPolicyMaker) {
        const rewardPolicyMakerFactory: RewardPolicyMaker__factory =
            <RewardPolicyMaker__factory> await ethers.getContractFactory("RewardPolicyMaker");

        const rewardPolicyMaker: RewardPolicyMaker = await rewardPolicyMakerFactory.deploy(86400 * 7, admin);
        await rewardPolicyMaker.deployed();

        deployments.RewardPolicyMaker = rewardPolicyMaker.address;
        console.log("Deployed rewardPolicyMaker: ", rewardPolicyMaker.address);
    }

    if (!deployments.GaugeControllerV2) {
        const gaugeControllerFactory: GaugeControllerV2__factory =
            <GaugeControllerV2__factory>await ethers.getContractFactory("GaugeControllerV2");

        const gaugeController: GaugeControllerV2 = await gaugeControllerFactory.deploy(deployments.MirroredVotingEscrow, admin);
        await gaugeController.deployed();

        deployments.GaugeControllerV2 = gaugeController.address;
        console.log("Deployed gauge controller: ", gaugeController.address);
    }

    if (!deployments.Minter) {
        const minterFactory: Minter__factory = <Minter__factory>await ethers.getContractFactory("Minter");
        const minter: Minter = await minterFactory.deploy(deployments.Treasury, deployments.GaugeControllerV2);
        await minter.deployed();

        deployments.Minter = minter.address;
        console.log("Deployed minter: ", minter.address);
    }

    if (!deployments.VotingEscrowDelegationV2) {
        const veBoostDelegationFactory: VotingEscrowDelegationV2__factory =
            <VotingEscrowDelegationV2__factory>await ethers.getContractFactory("VotingEscrowDelegationV2");

        const veBoostDelegation: VotingEscrowDelegationV2 =
            await veBoostDelegationFactory.deploy(
                "Delegated Mirrored Vote-escrowed HND",
                "dmveHND",
                "",
                deployments.MirroredVotingEscrow,
                admin
            );
        await veBoostDelegation.deployed();

        deployments.VotingEscrowDelegationV2 = veBoostDelegation.address;
        console.log("Deployed veBoost: ", veBoostDelegation.address);
    }

    if (!deployments.DelegationProxy) {
        const delegationProxyFactory: DelegationProxy__factory = <DelegationProxy__factory>await ethers.getContractFactory("DelegationProxy");
        const delegationProxy = await delegationProxyFactory.deploy(deployments.VotingEscrowDelegationV2, admin, admin, deployments.MirroredVotingEscrow);
        await delegationProxy.deployed();

        deployments.DelegationProxy = delegationProxy.address;
        console.log("Deployed veBoost proxy: ", delegationProxy.address);
    }

    const gaugeV4Factory: LiquidityGaugeV41__factory =
        <LiquidityGaugeV41__factory>await ethers.getContractFactory("LiquidityGaugeV4_1");

    for (let i = 0; i < pools.length; i++) {
        const pool = pools[i];
        const isAlreadyDeployed = deployments.Gauges.find(g => g.id === pool.id) !== undefined;
        if (!isAlreadyDeployed) {
            const gauge: LiquidityGaugeV41 = await gaugeV4Factory.deploy(
                pool.token, deployments.Minter, admin, deployments.RewardPolicyMaker, deployments.DelegationProxy, 200
            );
            await gauge.deployed();
            deployments.Gauges.push({ id: pool.id, address: gauge.address });
            console.log("Deployed gauge: ", pool.id, gauge.address);
        }
    }

    if (layerZeroEndpoint != "" && !deployments.MirrorGate) {
        await deployMirrorGate(admin, layerZeroEndpoint, deployments);
    }

    console.log("Please define type & call add_gauge on the contorller contract from the admin account");

    fs.writeFileSync(location, JSON.stringify(deployments, null, 4));
}

export async function deployNewGauge(
    admin: string, network: string, token: string, tokenName: string, type: number = 0, weight: number = 1
) {
    const [deployer] = await ethers.getSigners();
    const location = path.join(__dirname, `${network}/deployments.json`);
    let deployments: Deployment = JSON.parse(fs.readFileSync(location).toString());

    if (deployments.GaugeControllerV2 && deployments.DelegationProxy && deployments.RewardPolicyMaker && deployments.Minter) {

        let delegationProxy: DelegationProxy =
            <DelegationProxy>new Contract(deployments.DelegationProxy, patchAbiGasFields(DelegationProxyArtifact.abi), deployer);

        const gaugeV4Factory: LiquidityGaugeV41__factory =
            <LiquidityGaugeV41__factory>await ethers.getContractFactory("LiquidityGaugeV4_1");

        const gauge: LiquidityGaugeV41 = await gaugeV4Factory.deploy(
            token, deployments.Minter, admin, deployments.RewardPolicyMaker, delegationProxy.address, 200
        );
        await gauge.deployed();

        deployments.Gauges.push({ id: tokenName, address: gauge.address });
        console.log("Deployed gauge: ", tokenName, gauge.address);

        console.log("Please call add_gauge on the contorller contract from the admin account");

        fs.writeFileSync(location, JSON.stringify(deployments, null, 4));
    }
}

async function deploySmartWalletChecker(
    admin: string, deployments: Deployment
) {
    const smartWalletChecker: SmartWalletChecker__factory =
        <SmartWalletChecker__factory>await ethers.getContractFactory("SmartWalletChecker");

    const checker: SmartWalletChecker = await smartWalletChecker.deploy(admin);
    await checker.deployed();

    deployments.SmartWalletChecker = checker.address;
    console.log("Deployed smart wallet checker: ", checker.address);
}

async function deployLockCreatorChecker(
    admin: string, deployments: Deployment
) {
    const smartWalletChecker: SmartWalletChecker__factory =
        <SmartWalletChecker__factory>await ethers.getContractFactory("SmartWalletChecker");

    const checker: SmartWalletChecker = await smartWalletChecker.deploy(admin);
    await checker.deployed();

    deployments.LockCreatorChecker = checker.address;
    console.log("Deployed lock creator checker: ", checker.address);
}

async function deployMirrorGate(
    admin: string, zeroLayerEndpoint: string, deployments: Deployment
) {
    if (deployments.MirroredVotingEscrow) {
        const [deployer] = await ethers.getSigners();
        const chainId = await deployer.getChainId()

        const mirrorGateFactory: MirrorGate__factory = <MirrorGate__factory> await ethers.getContractFactory("MirrorGate");
        const mirrorGate: MirrorGate = await mirrorGateFactory.deploy(zeroLayerEndpoint, deployments.MirroredVotingEscrow, chainId);

        await mirrorGate.deployed();

        deployments.MirrorGate = mirrorGate.address;
        console.log("Deployed mirror gate: ", mirrorGate.address);

        if (admin.toLowerCase() !== deployer.address.toLowerCase()) {
            let tx = await mirrorGate.transferOwnership(admin);
            await tx.wait();
        }
    }
}

export async function deployHundredBond(
    hnd: string,
    admin: string,
    flavour: string = "deployments",
    verify: boolean = true
) {
    const network = hre.hardhatArguments.network;
    const location = path.join(__dirname, `${network}/${flavour}.json`);
    let deployments: Deployment = JSON.parse(fs.readFileSync(location).toString());
    let escrow = ""
    if (deployments.VotingEscrowV2) {
        escrow = deployments.VotingEscrowV2
    }

    if (deployments.VotingEscrowV1) {
        escrow = deployments.VotingEscrowV1
    }

    if (escrow && escrow.length > 0) {
        const [deployer] = await ethers.getSigners();

        if (!deployments.HundredBond) {
            const hundredBondFactory: HundredBond__factory = <HundredBond__factory> await ethers.getContractFactory("HundredBond");
            const hundredBond: HundredBond = await hundredBondFactory.deploy(
                hnd,
                escrow,
                deployments.VotingEscrowV2 !== undefined,
                200 * 7 * 24 * 3600
            );

            await hundredBond.deployed();

            deployments.HundredBond = hundredBond.address;
            console.log("Deployed hundred bond: ", hundredBond.address);

            fs.writeFileSync(location, JSON.stringify(deployments, null, 4));

            if (admin.toLowerCase() !== deployer.address.toLowerCase()) {
                let tx = await hundredBond.transferOwnership(admin);
                await tx.wait();
            }
        }

        if (verify) {
            console.log("verifying hundred bond: ", deployments.HundredBond);

            await hre.run("verify:verify", {
                address: deployments.HundredBond,
                constructorArguments: [
                    hnd,
                    escrow,
                    deployments.VotingEscrowV2 !== undefined,
                    200 * 7 * 24 * 3600
                ],
            });
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
    VotingEscrowV2?: string
    VotingEscrowV1?: string
    MirroredVotingEscrow?: string
    GaugeControllerV2?: string
    Treasury?: string
    RewardPolicyMaker?: string
    SmartWalletChecker?: string
    LockCreatorChecker?: string
    Minter?: string
    DelegationProxy?: string
    VotingEscrowDelegationV2?: string
    MerkleMirror?: string
    MirrorGate?: string
    HundredBond?: string
}