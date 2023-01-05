import {deploy} from "../helpers";
import hre from "hardhat";

const POOLS: any = [
    { id: "hUSDT", address: "0xb994B84bD13f7c8dD3af5BEe9dfAc68436DCF5BD", weight: 1 },
    { id: "hDAI",  address: "0x0145BE461a112c60c12c34d5Bc538d10670E99Ab", weight: 1 },
    { id: "hUSDC", address: "0x10E08556D6FdD62A9CE5B3a5b07B0d8b0D093164", weight: 1 },
    { id: "hSUSD", address: "0x76E47710AEe13581Ba5B19323325cA31c48d4cC3", weight: 1 },
    { id: "hFRAX", address: "0xd97a2591930E2Da927b1903BAA6763618BD7425b", weight: 1 },
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
