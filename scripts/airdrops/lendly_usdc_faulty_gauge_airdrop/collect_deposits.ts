import { ethers } from 'hardhat';
import {
    LiquidityGaugeV31,
} from "../../../typechain";
import * as LiquidityGaugeV31Artifact from "../../../artifacts/contracts/LiquidityGaugeV3_1.vy/LiquidityGaugeV3_1.json";


import * as fs from "fs";
import {Contract} from "ethers";
import {patchAbiGasFields} from "../utils/helpers";
import path from "path";

extractDeposits("0x333E3312b1D496a8dcA5cbF2BDaaC769D209A22D")
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

export async function extractDeposits(gauge: string) {

    const totalRewards = 5000;
    const [deployer] = await ethers.getSigners();

    let gaugeContract: LiquidityGaugeV31 =
        <LiquidityGaugeV31>new Contract(gauge, patchAbiGasFields(LiquidityGaugeV31Artifact.abi), deployer);

    let depositFilter = gaugeContract.filters.Deposit(null, null);
    let withdrawFilter = gaugeContract.filters.Withdraw(null, null);

    let deposits: any = []
    let withdrawals: any = []

    const startBlock = 31818918;
    const endBlock = 31982531;

    let blockNumber = startBlock;
    let step = 10000

    while(blockNumber < endBlock) {
        let events = await gaugeContract.queryFilter(depositFilter, blockNumber, blockNumber + step);
        deposits = [
            ...deposits,
            ...(events
                .map(event => {
                    return {
                        type: "Deposit",
                        user: event.args.provider,
                        amount: event.args.value.toString(),
                        block_number: event.blockNumber,
                    }
                }))
        ]
        blockNumber += step
    }

    console.log(`Found ${deposits.length} deposits`);

    blockNumber = startBlock;
    while(blockNumber < endBlock) {
        let events = await gaugeContract.queryFilter(withdrawFilter, blockNumber, blockNumber + step);
        withdrawals = [
            ...withdrawals,
            ...(events
                .map(event => {
                    return {
                        type: "Withdraw",
                        user: event.args.provider,
                        amount: event.args.value.toString(),
                        block_number: event.blockNumber,
                    }
                }))
        ]
        blockNumber += step
    }

    console.log(`Found ${deposits.length} withdrawals`);

    const userActions: any[] = [];

    for (let i = 0; i < deposits.length; i++) {
        let user = userActions.find(u => u.user === deposits[i].user)
        if (user) {
            user.actions = [...user.actions, deposits[i]]
            user.actions = user.actions.sort((a: any, b: any) => b.block_number - a.block_number)
        } else {
            userActions.push({
                user: deposits[i].user,
                actions: [deposits[i]]
            })
        }
    }

    for (let i = 0; i < withdrawals.length; i++) {
        let user = userActions.find(u => u.user === withdrawals[i].user)
        if (user) {
            user.actions = [...user.actions, withdrawals[i]]
            user.actions = user.actions.sort((a: any, b: any) => a.block_number - b.block_number)
        } else {
            userActions.push({
                user: withdrawals[i].user,
                actions: [withdrawals[i]]
            })
        }
    }

    let totalWeight = 0

    for(let i = 0; i < userActions.length; i++) {
        let weight = 0;
        let user = userActions[i];
        for (let j = 0; j < user.actions.length; j++) {
            let action = user.actions[j];
            if (action.type === "Withdraw") {
                let previousAction = user.actions[j-1];
                weight += (action.block_number - previousAction.block_number)* +action.amount
            }
        }
        if (weight === 0) {
            weight = (endBlock - user.actions[0].block_number) * +user.actions[0].amount
        }

        user.weight = weight;
        totalWeight += weight;
    }

    const rewards = [];

    for(let i = 0; i < userActions.length; i++) {
        let user = userActions[i];
        user.weight = user.weight * 100 / totalWeight;
        user.rewards = user.weight * totalRewards / 100;
        rewards.push(
            {
                user: user.user,
                amount: user.rewards
            }
        )
    }

    fs.writeFileSync(path.join(__dirname, `deposits.json` ), JSON.stringify(userActions, null, 4));
    fs.writeFileSync(path.join(__dirname, `rewards.json` ), JSON.stringify(rewards, null, 4));
}