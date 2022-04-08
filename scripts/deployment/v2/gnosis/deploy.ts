import {deploy} from "../helpers";
import hre from "hardhat";

const POOLS: any = [
    { id: "hxDAI", token: "0x090a00A2De0EA83DEf700B5e216f87a5D4F394FE", weight: 1 },
    { id: "hUSDC", token: "0x243E33aa7f6787154a8E59d3C27a66db3F8818ee", weight: 1 },
]

const HUNDRED_TOKEN = "0x10010078a54396F62c96dF8532dc2B4847d47ED3";
const ADMIN = "0xB95842A5E114f5D65b5B96aee42C025331C9417a";
const MULTICHAIN_ENDPOINT = "0x37414a8662bC1D25be3ee51Fb27C2686e2490A89";

const network = hre.hardhatArguments.network;
if (!network) {
    console.error("please provide valid network");
} else {
    deploy(HUNDRED_TOKEN, POOLS, network, ADMIN, "deployments", "", MULTICHAIN_ENDPOINT)
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}
