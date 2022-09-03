import hre, {ethers} from "hardhat";
import {ERC20, RewardPolicyMaker} from "../../typechain";
import path from "path";
import fs from "fs";
import {BigNumber} from "ethers";

const masterChef = "0x89db3b59381bc06fe9bf74532afd777e5f78ef02";
const hndPerSecond = "8267195767195767";
const rewardStartTime = "1637955490";

async function calculateMissingTopUp(futureDaysMargin: number) {
    const now = BigNumber.from(Date.now()).div(1000);
    const targetDate = now.add(BigNumber.from(futureDaysMargin).mul(24).mul(3600));
    // console.log(`###### Processing masterchef topups on ${hre.hardhatArguments.network} network`);

    const rewards = BigNumber.from(hndPerSecond).mul(targetDate.sub(rewardStartTime));
    // console.log("set rewards:", +rewards.toString()/1e18);

    const previousTopUps = await calculateTopUps();
    if (previousTopUps.lt(rewards)) {
        console.log("###### Outstanding top up", +rewards.sub(previousTopUps).toString() / 1e18, `to master chef ${masterChef} on arbitrum`);
    } else {
        // console.log("###### Treasury balance overflow", +previousTopUps.sub(rewards).toString() / 1e18);
    }
}

async function calculateTopUps(): Promise<BigNumber> {
    const network = hre.hardhatArguments.network;

    const historyLocation = path.join(__dirname, `topups-history/${network}-backstop-masterChef.json`);

    const hndContract = <ERC20>await ethers.getContractAt("ERC20", "0x10010078a54396F62c96dF8532dc2B4847d47ED3");

    let filter = hndContract.filters.Transfer(null, masterChef, null);

    let topUps = BigNumber.from(0);

    let previousTopups: {topups: any[], latestBlockNumber: number} = {
        topups: [],
        latestBlockNumber: 3363782
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

    let blockEnd = Math.min(currentBlock, blockStart + 100000);
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
        blockStart += 100000
        blockEnd = Math.min(await ethers.provider.getBlockNumber(), blockStart + 100000);

        previousTopups.latestBlockNumber = blockEnd;
        fs.writeFileSync(historyLocation, JSON.stringify(previousTopups, null, 4));
    }

    // console.log("Total treasury top up", +topUps.toString()/1e18);

    return topUps;
}

calculateMissingTopUp(7);