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
    Minter, LiquidityGaugeV4__factory, LiquidityGaugeV4
} from "../../typechain";
import * as fs from "fs";

export async function deploy(hnd: string, pools: any[], deployName: string) {

    let deployments: any = {
        gauges: []
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

    deployments["VotingEscrow"] = votingEscrow.address;

    const treasuryFactory: Treasury__factory =
        <Treasury__factory>await ethers.getContractFactory("Treasury");

    const treasury: Treasury = await treasuryFactory.deploy(hnd);
    await treasury.deployed();

    deployments["Treasury"] = treasury.address;

    const rewardPolicyMakerFactory: RewardPolicyMaker__factory =
        <RewardPolicyMaker__factory> await ethers.getContractFactory("RewardPolicyMaker");

    const rewardPolicyMaker: RewardPolicyMaker = await rewardPolicyMakerFactory.deploy(86400 * 7);
    await rewardPolicyMaker.deployed();

    deployments["RewardPolicyMaker"] = rewardPolicyMaker.address;

    const gaugeControllerFactory: GaugeController__factory =
        <GaugeController__factory>await ethers.getContractFactory("GaugeController");

    const gaugeController: GaugeController = await gaugeControllerFactory.deploy(hnd, votingEscrow.address);
    await gaugeController.deployed();

    deployments["GaugeController"] = gaugeController.address;

    const minterFactory: Minter__factory = <Minter__factory>await ethers.getContractFactory("Minter");
    const minter: Minter = await minterFactory.deploy(treasury.address, gaugeController.address);
    await minter.deployed();

    deployments["Minter"] = minter.address;

    let addMinterTrx = await treasury.set_minter(minter.address);
    await addMinterTrx.wait();

    let addGaugeTypeTrx = await gaugeController["add_type(string,uint256)"]("Stables", ethers.utils.parseEther("10"));
    await addGaugeTypeTrx.wait();

    const gaugeV4Factory: LiquidityGaugeV4__factory =
        <LiquidityGaugeV4__factory>await ethers.getContractFactory("LiquidityGaugeV4");

    for (let i = 0; i < pools.length; i++) {
        const pool = pools[i];

        const gauge: LiquidityGaugeV4 = await gaugeV4Factory.deploy(
            pool.token, minter.address, deployer.address, rewardPolicyMaker.address
        );
        await gauge.deployed();
        deployments.gauges.push({ id: pool.id, address: gauge.address });

        let trx = await gaugeController["add_gauge(address,int128,uint256)"](gauge.address, 0, pool.weight);
        await trx.wait();
    }

    fs.writeFileSync(`./${deployName}_deployments.json`, JSON.stringify(deployments, null, 4));
}
