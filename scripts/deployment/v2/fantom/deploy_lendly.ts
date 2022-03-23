import {deploy} from "../helpers";
import hre from "hardhat";

const POOLS: any = []

const HUNDRED_TOKEN = "0x10010078a54396F62c96dF8532dc2B4847d47ED3";
const ADMIN = "0xD0Bb8e4E4Dd5FDCD5D54f78263F5Ec8f33da4C95";
const LAYER_ZERO_ENDPOINT = "0xb6319cC6c8c27A8F5dAF0dD3DF91EA35C4720dd7";

const network = hre.hardhatArguments.network;
if (!network) {
    console.error("please provide valid network");
} else {
    deploy(HUNDRED_TOKEN, POOLS, network, ADMIN, "lendly-deployments", LAYER_ZERO_ENDPOINT)
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}
