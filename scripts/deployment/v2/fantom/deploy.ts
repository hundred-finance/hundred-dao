import {deploy} from "../helpers";
import hre from "hardhat";

const POOLS: any = [
    { id: "hUSDC", token: "0x243e33aa7f6787154a8e59d3c27a66db3f8818ee", weight: 1 },
    { id: "hUSDT", token: "0xe4e43864ea18d5e5211352a4b810383460ab7fcc", weight: 1 },
    { id: "hMIM", token: "0xa8cd5d59827514bcf343ec19f531ce1788ea48f8", weight: 1 },
    { id: "hFRAX", token: "0xb4300e088a3ae4e624ee5c71bc1822f68bb5f2bc", weight: 1 },
    { id: "hDAI", token: "0x8e15a22853a0a60a0fbb0d875055a8e66cff0235", weight: 1 },
]

const HUNDRED_TOKEN = "0x10010078a54396F62c96dF8532dc2B4847d47ED3";
const ADMIN = "0xD0Bb8e4E4Dd5FDCD5D54f78263F5Ec8f33da4C95";
const LAYER_ZERO_ENDPOINT = "0xb6319cC6c8c27A8F5dAF0dD3DF91EA35C4720dd7";
const MULTICHAIN_ENDPOINT = "0xC10Ef9F491C9B59f936957026020C321651ac078";

const network = hre.hardhatArguments.network;
if (!network) {
    console.error("please provide valid network");
} else {
    deploy(HUNDRED_TOKEN, POOLS, network, ADMIN, "deployments", LAYER_ZERO_ENDPOINT, MULTICHAIN_ENDPOINT)
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}
