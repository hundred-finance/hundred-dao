import {deploy} from "../helpers";
import hre from "hardhat";

const POOLS: any = [
    { id: "lUSDC", token: "0xA33138a5A6A32d12b2Ac7Fc261378d6C6AB2eF90", weight: 1 },
    { id: "lwUSDC", token: "0x2084dCB19D498b8Eb4f1021B14A34308c077cf94", weight: 1 },
]

const HUNDRED_TOKEN = "0x10010078a54396F62c96dF8532dc2B4847d47ED3";
const ADMIN = "0xD0Bb8e4E4Dd5FDCD5D54f78263F5Ec8f33da4C95"

const network = hre.hardhatArguments.network;
if (!network) {
    console.error("please provide valid network");
} else {
    deploy(HUNDRED_TOKEN, POOLS, network, ADMIN, "lendly-deployments")
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}
