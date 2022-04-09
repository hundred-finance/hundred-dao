import {deploy} from "../helpers";
import hre from "hardhat";

const POOLS: any = [
    { id: "hUSDC", token: "0x8e15a22853A0A60a0FBB0d875055A8E66cff0235", weight: 1 },
    { id: "hUSDT", token: "0xfCD8570AD81e6c77b8D252bEbEBA62ed980BD64D", weight: 1 },
    { id: "hUST", token: "0x376020c5b0ba3fd603d7722381faa06da8078d8a", weight: 1 },
]

const HUNDRED_TOKEN = "0x10010078a54396F62c96dF8532dc2B4847d47ED3";
const ADMIN = "0xC79354D37BD6B290Acc52C58798ACaa3CecD0b1B"
const MULTICHAIN_ENDPOINT = "0x6f058086d91a181007c2325e5b285425ca84d615";

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
