import {deploy} from "../helpers";
import hre from "hardhat";

const POOLS: any = [
    { id: "bhDAI", token: "0xCebDf18Ac062Cfa15fb3416dD453342e72b17E25", weight: 1 },
    { id: "bhUSDC", token: "0xEDCE1C21ad6cb55D647671682b35766EA4a440f1", weight: 1 },
    { id: "bhUSDT", token: "0xEDCE1C21ad6cb55D647671682b35766EA4a440f1", weight: 1 },
]

const HUNDRED_TOKEN = "0x10010078a54396F62c96dF8532dc2B4847d47ED3";
const ADMIN = "0xD0A27F0eBA2B407f2cCA8327b4Adb50BBAddFF24"
const LAYER_ZERO_ENDPOINT = "0x3c2269811836af69497E5F486A85D7316753cf62";

const network = hre.hardhatArguments.network;
if (!network) {
    console.error("please provide valid network");
} else {
    deploy(HUNDRED_TOKEN, POOLS, network, ADMIN, "deployments-backstop", LAYER_ZERO_ENDPOINT)
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}
