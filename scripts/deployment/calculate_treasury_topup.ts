import hre, {ethers} from "hardhat";
import {ERC20, RewardPolicyMaker} from "../../typechain";
import path from "path";
import fs from "fs";
import {BigNumber} from "ethers";

const BlockSettings = [
    { chain: "arbitrum", start: 4545990, step: 100000},
    { chain: "fantom", start: 27592101, step: 100000},
    { chain: "gnosis", start: 20759488, step: 100000},
    { chain: "harmony", start: 21572414, step: 1000},
    { chain: "moonriver", start: 1269701, step: 1000},
    { chain: "optimism", start: 4125823, step: 10000},
    { chain: "polygon", start: 26277944, step: 10000},
]

async function calculateMissingTopUps(version: string, futureEpochsMargin: number) {
    await calculateMissingFlavorTopUp("deployments", version, futureEpochsMargin);
    await calculateMissingFlavorTopUp("backstop-deployments", version, futureEpochsMargin);
}

async function calculateMissingFlavorTopUp(flavor: string, version: string, futureEpochsMargin: number) {
    const network = hre.hardhatArguments.network;
    const location = path.join(__dirname, `${version}/${network}/${flavor}.json`);
    try {
        const deployments = JSON.parse(fs.readFileSync(location).toString());

        console.log(`------ Processing flavor: ${flavor} on ${network} network`);

        const rewards = await calculateRewards(flavor, deployments.RewardPolicyMaker, futureEpochsMargin);
        if (rewards.gt(0)) {
            const previousTopUps = await calculateTopUps(flavor, deployments.Treasury);

            if (previousTopUps.lt(rewards)) {
                console.log("######### Outstanding top up", +rewards.sub(previousTopUps).toString() / 1e18, `for gauge treasury ${deployments.Treasury}`);
            } else {
                console.log("------ Treasury balance overflow", +previousTopUps.sub(rewards).toString() / 1e18);
            }
        }
    } catch (e) {
        // console.log("error", e);
        // console.log(`------ Flavor: ${flavor} not deployed on ${network} network`);
    }
}

async function calculateRewards(flavor: string, rewardPolicyMaker: string, futureEpochsMargin: number): Promise<BigNumber> {
    const rewardContract = <RewardPolicyMaker>await ethers.getContractAt("RewardPolicyMaker", rewardPolicyMaker);
    const currenEpoch = await rewardContract.current_epoch();
    let epoch = -1;
    let lastEpochWithNonZeroRewards = -1;
    let firstEpochWithNonZeroRewards = -1;

    // console.log("Current epoch", currenEpoch.toString())

    let epochRewards = BigNumber.from(0);
    let totalRewards = BigNumber.from(0);

    while (epochRewards.eq(0) && currenEpoch.add(futureEpochsMargin + 1).gt(epoch)) {
        epoch++
        epochRewards = await rewardContract.rewards(epoch);
    }

    firstEpochWithNonZeroRewards = epoch;

    if (epochRewards.gt(0)) {
        // console.log(`First epoch with non 0 rewards ${firstEpochWithNonZeroRewards}`);

        while (currenEpoch.add(futureEpochsMargin + 1).gt(epoch)) {
            totalRewards = totalRewards.add(epochRewards);

            epoch++;
            epochRewards = await rewardContract.rewards(epoch);

            if (epochRewards.gt(0)) {
                lastEpochWithNonZeroRewards = epoch;
            }
        }

        const lastEpochRewards = await rewardContract.rewards(lastEpochWithNonZeroRewards);
        // console.log(`Last epoch with non 0 rewards ${lastEpochWithNonZeroRewards} with rewards ${+lastEpochRewards.toString() / 1e18} HND`);
    }

    if (totalRewards.gt(0) && lastEpochWithNonZeroRewards === currenEpoch.toNumber()) {
        const lastEpochRewards = await rewardContract.rewards(currenEpoch);
        console.log(`######### Set rewards for next epoch ${currenEpoch.toNumber()+1} (current ${+lastEpochRewards.toString() / 1e18} HND), contract: ${rewardPolicyMaker}`)
    }

    // console.log("Total defined HND rewards", +totalRewards.toString() / 1e18);

    return totalRewards;
}

async function calculateTopUps(flavor: string, treasury: string): Promise<BigNumber> {
    const network = hre.hardhatArguments.network;
    const historyLocation = path.join(__dirname, `topups-history/${network}-${flavor}.json`);

    const hndContract = <ERC20>await ethers.getContractAt("ERC20", "0x10010078a54396F62c96dF8532dc2B4847d47ED3");

    let filter = hndContract.filters.Transfer(null, treasury, null);

    let topUps = BigNumber.from(0);
    const blockLimits = BlockSettings.find(b => b.chain === network);
    if (blockLimits) {
        let previousTopups: {topups: any[], latestBlockNumber: number} = {
            topups: [],
            latestBlockNumber: blockLimits.start
        };
        try {
            previousTopups = JSON.parse(fs.readFileSync(historyLocation).toString());
        } catch (e) {}

        let blockStart = previousTopups.latestBlockNumber;
        if (previousTopups.topups.length > 0) {
            topUps = topUps.add(
                previousTopups.topups.map(v => BigNumber.from(v.value)).reduce((a,b) => a.add(b))
            );
        }

        const currentBlock = await ethers.provider.getBlockNumber();
        // console.log("Scanning transfer events in block range", blockStart, currentBlock);
        // console.log("This may take a while... :(");

        let blockEnd = Math.min(currentBlock, blockStart + blockLimits.step);
        while(blockStart < blockEnd) {
            let events = await hndContract.queryFilter(filter, blockStart, blockEnd);
            if (events.length > 0) {

                events.forEach(event => {
                    previousTopups.topups.push({
                        blockNumber: event.blockNumber,
                        value: event.args.value.toString()
                    });
                });

                const topUp = events.map(event => event.args.value).reduce((a, b) => a.add(b));
                // console.log("Topup found in block range", blockStart, blockEnd, +topUp.toString() / 1e18);
                topUps = topUps.add(topUp);

            }
            blockStart += blockLimits.step
            blockEnd = Math.min(await ethers.provider.getBlockNumber(), blockStart + blockLimits.step);

            previousTopups.latestBlockNumber = blockEnd;
            fs.writeFileSync(historyLocation, JSON.stringify(previousTopups, null, 4));
        }
    }

    // console.log("Total treasury top up", +topUps.toString()/1e18);

    return topUps;
}

calculateMissingTopUps("v2", 1);