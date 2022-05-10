import {deploy, initGaugesAndTreasury} from "../helpers";
import hre from "hardhat";

const POOLS = [
    { id: "hDAI", token: "0x89db3B59381bC06FE9BF74532Afd777e5F78Ef02" },
    { id: "hUSDC", token: "0x243E33aa7f6787154a8E59d3C27a66db3F8818ee" },
    { id: "hUSDT", token: "0xEdBA32185BAF7fEf9A26ca567bC4A6cbe426e499" },
    { id: "hSUSD", token: "0xa8cD5D59827514BCF343EC19F531ce1788Ea48f8" },
    { id: "hTUSD", token: "0x772918d032cFd4Ff09Ea7Af623e56E2D8D96bB65" },
    { id: "hBUSD", token: "0xb1c4426C86082D91a6c097fC588E5D5d8dD1f5a8" },
]

const HUNDRED_TOKEN = "0x10010054c81c8c01951E6A631dD228bB02d8D1e5";
const ADMIN = "0x8286dC6dF929C4BfA4f6951caB4dAe2EC02d4D72"

const network = hre.hardhatArguments.network;
if (!network) {
    console.error("please provide valid network");
} else {
    deploy(HUNDRED_TOKEN, POOLS, network, ADMIN)
        .then(() => {
            return initGaugesAndTreasury(network);
        })
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}
