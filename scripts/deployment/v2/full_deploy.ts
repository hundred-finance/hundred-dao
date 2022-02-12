import {deploy} from "./helpers";
import hre from "hardhat";

const POOLS: any = [
    { id: "hDAI", token: "0x89db3B59381bC06FE9BF74532Afd777e5F78Ef02", weight: 1 },
    { id: "hUST", token: "0xEdBA32185BAF7fEf9A26ca567bC4A6cbe426e499", weight: 1 },
    { id: "hUSDC", token: "0x243E33aa7f6787154a8E59d3C27a66db3F8818ee", weight: 1 },
    { id: "hBUSD", token: "0xb1c4426C86082D91a6c097fC588E5D5d8dD1f5a8", weight: 1 },
]

const HUNDRED_TOKEN = "0x10010054c81c8c01951E6A631dD228bB02d8D1e5";

const network = hre.hardhatArguments.network;
if (!network) {
    console.error("please provide valid network");
} else {
    deploy(HUNDRED_TOKEN, POOLS, network)
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}
