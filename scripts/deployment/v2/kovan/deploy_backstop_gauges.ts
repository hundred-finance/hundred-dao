import {deploy, initGaugesAndTreasury} from "../helpers";
import hre from "hardhat";

const POOLS: any = [
    { id: "bhUSDT", token: "0x207A0B6b61815c870b9e85B3DA7e26778DD5dff7", weight: 1 },
    { id: "bhUSDC", token: "0xae6277c3e741EcAf7A188AAb4543b05CCAbBfDf9", weight: 1 },
    { id: "bhDAI", token: "0xB48bd808b9e8F0331Fd02B6d7788d0C9C8fE63E7", weight: 1 },
]

const HUNDRED_TOKEN = "0x10010054c81c8c01951E6A631dD228bB02d8D1e5";
const ADMIN = "0x8286dC6dF929C4BfA4f6951caB4dAe2EC02d4D72"
const flavor = "backstop-gauges-deployments"

const network = hre.hardhatArguments.network;
if (!network) {
    console.error("please provide valid network");
} else {
    deploy(HUNDRED_TOKEN, POOLS, network, ADMIN, flavor)
        .then(() => {
            return initGaugesAndTreasury(network, flavor);
        })
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}