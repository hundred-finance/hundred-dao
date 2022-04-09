import {deploy} from "../helpers";
import hre from "hardhat";

const POOLS: any = [
    { id: "bhUSDC", token: "0x51fbf83818e4fa195fd5d395a63fcfb5c45d9565", weight: 1 },
]

const HUNDRED_TOKEN = "0x10010078a54396F62c96dF8532dc2B4847d47ED3";
const ADMIN = "0xb982841d8Caf7cCc1b5c8ec414347316F54A06c9"
const LAYER_ZERO_ENDPOINT = "0x3c2269811836af69497E5F486A85D7316753cf62";
const MULTICHAIN_ENDPOINT = "0x37414a8662bC1D25be3ee51Fb27C2686e2490A89";

const network = hre.hardhatArguments.network;
if (!network) {
    console.error("please provide valid network");
} else {
    deploy(HUNDRED_TOKEN, POOLS, network, ADMIN, "backstop-gauges-deployments", LAYER_ZERO_ENDPOINT, MULTICHAIN_ENDPOINT)
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}
