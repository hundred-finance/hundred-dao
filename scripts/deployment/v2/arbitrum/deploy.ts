import {deploy} from "../helpers";
import hre from "hardhat";

const POOLS: any = [
    { id: "hUSDC", token: "0xfcd8570ad81e6c77b8d252bebeba62ed980bd64d", weight: 1 },
    { id: "hUSDT", token: "0x607312a5c671d0c511998171e634de32156e69d0", weight: 1 },
    { id: "hMIM", token: "0x376020c5b0ba3fd603d7722381faa06da8078d8a", weight: 1 },
    { id: "hFRAX", token: "0xb1c4426c86082d91a6c097fc588e5d5d8dd1f5a8", weight: 1 },
    { id: "hDAI", token: "0x6bb6ebCf3aC808E26545d59EA60F27A202cE8586", weight: 1 },
]

const HUNDRED_TOKEN = "0x10010078a54396F62c96dF8532dc2B4847d47ED3";
const ADMIN = "0xb982841d8Caf7cCc1b5c8ec414347316F54A06c9"
const LAYER_ZERO_ENDPOINT = "0x3c2269811836af69497E5F486A85D7316753cf62";
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
