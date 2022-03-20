import {deploy} from "../helpers";
import hre from "hardhat";

const POOLS: any = []

const HUNDRED_TOKEN = "0x10010078a54396F62c96dF8532dc2B4847d47ED3";
const ADMIN = "0x8286dC6dF929C4BfA4f6951caB4dAe2EC02d4D72"
const LAYER_ZERO_ENDPOINT = "0x72aB53a133b27Fa428ca7Dc263080807AfEc91b5"

const network = hre.hardhatArguments.network;
if (!network) {
    console.error("please provide valid network");
} else {
    deploy(HUNDRED_TOKEN, POOLS, network, ADMIN, "deployments", LAYER_ZERO_ENDPOINT)
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}
