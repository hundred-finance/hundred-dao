import {deploy} from "../helpers";
import hre from "hardhat";

const POOLS: any = [
    { id: "hxDAI", token: "0x6eDCB931168C9F7C20144f201537c0243b19dCA4", weight: 1 },
    { id: "hUSDC", token: "0xbd193db8a909cAC57Cdb981Ea81B5dc270287F19", weight: 1 },
]

const HUNDRED_TOKEN = "0x10010078a54396F62c96dF8532dc2B4847d47ED3";
const ADMIN = "0xB95842A5E114f5D65b5B96aee42C025331C9417a";
const MULTICHAIN_ENDPOINT = "0x37414a8662bC1D25be3ee51Fb27C2686e2490A89";

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
