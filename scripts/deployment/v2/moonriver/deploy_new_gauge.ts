import {deployNewGauge} from "../helpers";
import hre from "hardhat";

const ADMIN = "0xBf3bD01bd5fB28d2381d41A8eF779E6aa6f0a811"
const LP_TOKEN = ""
const LP_TOKEN_SYMBOL = ""

const network = hre.hardhatArguments.network;
if (!network) {
    console.error("please provide valid network");
} else {
    deployNewGauge(
        ADMIN,
        network,
        LP_TOKEN,
        LP_TOKEN_SYMBOL
    )
        .then(() => process.exit(0))
        .catch(error => {
                console.error(error);
                process.exit(1);
        });
}