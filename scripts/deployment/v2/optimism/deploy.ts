import {deploy} from "../helpers";
import hre from "hardhat";

const POOLS: any = [
    { id: "hDAI", token: "0x607312a5C671D0C511998171e634DE32156e69d0", weight: 1 },
    { id: "hUSDC", token: "0x103f2CA2148B863942397dbc50a425cc4f4E9A27", weight: 1 },
    { id: "hSUSD", token: "0x42B458056f887Fd665ed6f160A59Afe932e1F559", weight: 1 },
]

const HUNDRED_TOKEN = "0x10010078a54396F62c96dF8532dc2B4847d47ED3";
const ADMIN = "0x641f26c67A5D0829Ae61019131093B6a7c7d18a3"
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
