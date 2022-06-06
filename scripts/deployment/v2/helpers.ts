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
    VotingEscrowDelegationV2,
    VotingEscrow,
    MirrorGate__factory,
    MirrorGate,
    HundredBond__factory,
    HundredBond,
    MultiChainMirrorGateV2__factory,
    MultiChainMirrorGateV2, VeGNO__factory
} from "../../../typechain";

import * as VotingEscrowV1Artifact from "../../../artifacts/contracts/VotingEscrow.vy/VotingEscrow.json";
import * as VotingEscrowV2Artifact from "../../../artifacts/contracts/VotingEscrowV2.vy/VotingEscrowV2.json";

import * as fs from "fs";
import {Contract} from "ethers";
import path from "path";

export async function deploy(
    hnd: string,
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

    if (multiChainEndpoint != "" && !deployments.MultichainMirrorGateV2) {
        await deployMultiChainMirrorGate(admin, multiChainEndpoint, deployments);
    }

    console.log("Please define type & call add_gauge on the controller contract from the admin account");

    fs.writeFileSync(location, JSON.stringify(deployments, null, 4));
}

export async function initGaugesAndTreasury(network: string, flavor: string = "deployments") {
    const [deployer] = await ethers.getSigners();
    const location = path.join(__dirname, `${network}/${flavor}.json`);
    let deployments: Deployment = JSON.parse(fs.readFileSync(location).toString());

    if (deployments.GaugeControllerV2 && deployments.Gauges.length > 0 && deployments.Treasury && deployments.Minter) {
        const controller: GaugeControllerV2 =
            <GaugeControllerV2>await ethers.getContractAt("GaugeControllerV2", deployments.GaugeControllerV2, deployer);

        let tx = await controller["add_type(string,uint256)"]("Stables", 100);
        await tx.wait();

        for (let i = 0; i < deployments.Gauges.length; i++) {
            let tx = await controller["add_gauge(address,int128,uint256)"](deployments.Gauges[i].address, 0, 1);
            await tx.wait();
        }

        const treasury: Treasury =
            <Treasury>await ethers.getContractAt("Treasury", deployments.Treasury, deployer);

        tx = await treasury.set_minter(deployments.Minter);
        await tx.wait();
    }
}

export async function whiteListMirrorGates(network: string, flavor: string = "deployments") {
    const [deployer] = await ethers.getSigners();
    const location = path.join(__dirname, `${network}/${flavor}.json`);
    let deployments: Deployment = JSON.parse(fs.readFileSync(location).toString());

    if (deployments.MirroredVotingEscrow && deployments.MultichainMirrorGateV2) {
        const escrow: MirroredVotingEscrow =
            <MirroredVotingEscrow>await ethers.getContractAt("MirroredVotingEscrow", deployments.MirroredVotingEscrow, deployer);

        const gate: MultiChainMirrorGateV2 =
            <MultiChainMirrorGateV2>await ethers.getContractAt("MultiChainMirrorGateV2", deployments.MultichainMirrorGateV2);

        let tx = await escrow.set_mirror_whitelist(deployments.MultichainMirrorGateV2, true);
        await tx.wait();

        tx = await gate.setupAllowedCallers(
            ["0xba0649B1a51Ab1f0074E26Ba164b26EBF6e9a91e", "0xA0c94183a74CF22dE491DcbB02fc7433267c6D32", "0xA0c94183a74CF22dE491DcbB02fc7433267c6D32", "0x1cF3993EbA538e5f085333c86356622161Dd8C0B", "0x1Ac7Cb8D9e3AC86296a5DEA9d55BF846AB459bA9", "0x989b2F0722808d9F9c574363fA8759e925f30F12", "0x6c63287CC629417E96b77DD7184748Bb6536A4e2", "0xd33d15f91A25Ec74dd9224E71C5175BA9DC4e01D"],
            [200, 250, 100, 1666600000, 4689, 1285, 10, 137],
            [true, true, true, true, true, true, true, true]
        );
        await tx.wait();
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

export async function deployVeGno(gno: string, unlockTime: number, admin: string) {
    const [deployer] = await ethers.getSigners();
    const network = hre.hardhatArguments.network;
    const location = path.join(__dirname, `${network}/deployments.json`);
    let deployments: Deployment = JSON.parse(fs.readFileSync(location).toString());

    const veGnoFactory: VeGNO__factory = <VeGNO__factory>await ethers.getContractFactory("veGNO");
    const veGno = await veGnoFactory.deploy(gno, unlockTime);

    await veGno.deployed();

    deployments.VeGno = veGno.address;
    console.log("Deployed veGNO: ", veGno.address);

    fs.writeFileSync(location, JSON.stringify(deployments, null, 4));

    if (admin.toLowerCase() !== deployer.address.toLowerCase()) {
        console.log("Transfer veGNO ownership to: ", admin);
        let tx = await veGno.transferOwnership(admin);
        await tx.wait();
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
    MultichainMirrorGate?: string
    MultichainMirrorGateV2?: string
    HundredBond?: string
    VeGno?: string
}