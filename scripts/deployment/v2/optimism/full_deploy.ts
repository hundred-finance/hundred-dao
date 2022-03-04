import {deploy} from "../helpers";
import hre from "hardhat";

const POOLS: any = [
    { id: "hDAI", token: "0xbb93C7F378B9b531216f9aD7b5748be189A55807", weight: 1 },
    { id: "hUSDC", token: "0x8e15a22853A0A60a0FBB0d875055A8E66cff0235", weight: 1 },
    { id: "hUSDT", token: "0xfCD8570AD81e6c77b8D252bEbEBA62ed980BD64D", weight: 1 },
]

const HUNDRED_TOKEN = "0x10010078a54396F62c96dF8532dc2B4847d47ED3";
const ADMIN = "0x641f26c67A5D0829Ae61019131093B6a7c7d18a3"

const network = hre.hardhatArguments.network;
if (!network) {
    console.error("please provide valid network");
} else {
    deploy(HUNDRED_TOKEN, POOLS, network, ADMIN)
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}
