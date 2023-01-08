import hre, { ethers } from 'hardhat';
import {
    VotingEscrowV2__factory,
    VotingEscrowV2,
    MirroredVotingEscrow__factory,
    MirroredVotingEscrow,
    TreasuryV2__factory,
    TreasuryV2,
    RewardPolicyMakerV2,
    RewardPolicyMakerV2__factory,
    GaugeControllerV2__factory,
    GaugeControllerV2,
    LiquidityGaugeV5__factory,
    LiquidityGaugeV5,
    MinterV2__factory,
    MinterV2,
    SmartWalletChecker__factory,
    SmartWalletChecker,
    DelegationProxy__factory,
    DelegationProxy,
    VotingEscrowDelegationV2__factory,
    VotingEscrowDelegationV2,
    VotingEscrow,
    MirrorGate__factory,
    MirrorGate,
    MultiChainMirrorGateV2__factory,
    MultiChainMirrorGateV2
} from "../../../typechain";

import * as VotingEscrowV1Artifact from "../../../artifacts/contracts/VotingEscrow.vy/VotingEscrow.json";
import * as VotingEscrowV2Artifact from "../../../artifacts/contracts/VotingEscrowV2.vy/VotingEscrowV2.json";

import * as fs from "fs";
import {Contract} from "ethers";
import path from "path";

export async function deploy(
    hnd: string,
    rewardTokens: string[],
    pools: any[],
    network: string,
    admin: string,
    flavour: string = "deployments",
    layerZeroEndpoint: string = "",
    multiChainEndpoint: string = ""
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
        if (addr && addr !== "0x0000000000000000000000000000000000000000") {
            deployments.SmartWalletChecker = await votingEscrow.smart_wallet_checker();
        } else {
            await deploySmartWalletChecker(admin, deployments);
        }
    } else if (deployments.VotingEscrowV2) {
        let votingEscrow: VotingEscrowV2 =
            <VotingEscrowV2>new Contract(deployments.VotingEscrowV2, patchAbiGasFields(VotingEscrowV2Artifact.abi), deployer);

        deployments.SmartWalletChecker = await votingEscrow.smart_wallet_checker();
        deployments.LockCreatorChecker = await votingEscrow.lock_creator_checker();
    }

    if (!deployments.TreasuryV2) {
        const treasuryFactory: TreasuryV2__factory =
            <TreasuryV2__factory>await ethers.getContractFactory("TreasuryV2");

        const treasury: TreasuryV2 = await treasuryFactory.deploy(deployer.address);
        await treasury.deployed();

        deployments.TreasuryV2 = treasury.address;
        console.log("Deployed Treasury: ", treasury.address);
    }

    if (!deployments.RewardPolicyMakerV2) {
        const rewardPolicyMakerFactory: RewardPolicyMakerV2__factory =
            <RewardPolicyMakerV2__factory> await ethers.getContractFactory("RewardPolicyMakerV2");

        const rewardPolicyMaker: RewardPolicyMakerV2 = await rewardPolicyMakerFactory.deploy(86400 * 7, admin);
        await rewardPolicyMaker.deployed();

        deployments.RewardPolicyMakerV2 = rewardPolicyMaker.address;
        console.log("Deployed rewardPolicyMaker: ", rewardPolicyMaker.address);
    }

    if (!deployments.GaugeControllerV2) {
        const gaugeControllerFactory: GaugeControllerV2__factory =
            <GaugeControllerV2__factory>await ethers.getContractFactory("GaugeControllerV2");

        const gaugeController: GaugeControllerV2 = await gaugeControllerFactory.deploy(deployments.MirroredVotingEscrow, deployer.address);
        await gaugeController.deployed();

        deployments.GaugeControllerV2 = gaugeController.address;
        console.log("Deployed gauge controller: ", gaugeController.address);
    }

    if (!deployments.MinterV2) {
        const treasury: TreasuryV2 = <TreasuryV2>await ethers.getContractAt('TreasuryV2', deployments.TreasuryV2);
        const minterFactory: MinterV2__factory = <MinterV2__factory>await ethers.getContractFactory("MinterV2");
        const minter: MinterV2 = await minterFactory.deploy(deployments.TreasuryV2, deployments.GaugeControllerV2);
        await minter.deployed();

        let tx = await minter.add_token(hnd);
        await tx.wait();
        for (let rToken of rewardTokens) {
            tx = await minter.add_token(rToken);
            await tx.wait();
        }

        tx = await treasury.set_minter(minter.address);
        await tx.wait();

        tx = await treasury.set_admin(admin);
        await tx.wait();

        tx = await minter.set_admin(admin);
        await tx.wait();

        deployments.MinterV2 = minter.address;
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

    const gaugeV5Factory: LiquidityGaugeV5__factory =
        <LiquidityGaugeV5__factory>await ethers.getContractFactory("LiquidityGaugeV5");

    const controller: GaugeControllerV2 =
        <GaugeControllerV2>await ethers.getContractAt("GaugeControllerV2", deployments.GaugeControllerV2);

    const gaugeTypesCount = await controller.n_gauge_types();
    if (gaugeTypesCount.eq(0)) {
        let tx = await controller["add_type(string,uint256)"]("Stables", 100);
        await tx.wait();
    }

    const controllerAdmin = await controller.admin();

    for (let i = 0; i < pools.length; i++) {
        const pool = pools[i];
        const isAlreadyDeployed = deployments.Gauges.find(g => g.id === pool.id) !== undefined;
        if (!isAlreadyDeployed) {
            const gauge: LiquidityGaugeV5 = await gaugeV5Factory.deploy(
                pool.token, deployments.MinterV2, admin, deployments.RewardPolicyMakerV2, deployments.DelegationProxy
            );
            await gauge.deployed();

            if (controllerAdmin.toLowerCase() === deployer.address.toLowerCase()) {
                let tx = await controller["add_gauge(address,int128,uint256)"](gauge.address, 0, pool.weight);
                await tx.wait();
            }
            deployments.Gauges.push({ id: pool.id, address: gauge.address });
            console.log("Deployed gauge: ", pool.id, gauge.address);
        }
    }


    if (controllerAdmin.toLowerCase() !== admin.toLowerCase()) {
        let tx = await controller.commit_transfer_ownership(admin);
        await tx.wait();

        tx = await controller.apply_transfer_ownership();
        await tx.wait();
    }

    if (layerZeroEndpoint != "" && !deployments.MirrorGate) {
        await deployMirrorGate(admin, layerZeroEndpoint, deployments);
    }

    if (multiChainEndpoint != "" && !deployments.MultichainMirrorGateV2) {
        await deployMultiChainMirrorGate(admin, multiChainEndpoint, deployments);
    }

    console.log("Please define type & call add_gauge on the controller contract from the admin account");

    fs.writeFileSync(location, JSON.stringify(deployments, null, 4));
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

async function deployMultiChainMirrorGate(
    admin: string, multiChainEndpoint: string, deployments: Deployment
) {
    if (deployments.MirroredVotingEscrow) {
        const [deployer] = await ethers.getSigners();
        const chainId = await deployer.getChainId();

        console.log("Deploying multichain gate contract with the account:", deployer.address);
        console.log("Account balance:", (await deployer.getBalance()).toString());

        const mirrorGateFactory: MultiChainMirrorGateV2__factory = <MultiChainMirrorGateV2__factory> await ethers.getContractFactory("MultiChainMirrorGateV2");
        const mirrorGate: MultiChainMirrorGateV2 = await mirrorGateFactory
            .deploy(multiChainEndpoint, deployments.MirroredVotingEscrow, chainId);

        await mirrorGate.deployed();

        deployments.MultichainMirrorGateV2 = mirrorGate.address;
        console.log("Deployed multichain mirror gate: ", deployments.MultichainMirrorGateV2);

        if (admin.toLowerCase() !== deployer.address.toLowerCase()) {
            let tx = await mirrorGate.transferOwnership(admin);
            await tx.wait();
        }

        console.log("verifying multichain gate contract: ", deployments.MultichainMirrorGateV2);

        await hre.run("verify:verify", {
            address: deployments.MultichainMirrorGateV2,
            constructorArguments: [
                multiChainEndpoint, deployments.MirroredVotingEscrow, chainId
            ],
        });
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
    TreasuryV2?: string
    RewardPolicyMakerV2?: string
    SmartWalletChecker?: string
    LockCreatorChecker?: string
    MinterV2?: string
    DelegationProxy?: string
    VotingEscrowDelegationV2?: string
    MirrorGate?: string
    MultichainMirrorGate?: string
    MultichainMirrorGateV2?: string
}