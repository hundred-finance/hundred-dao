import {deployNewGauge} from "../helpers";
import hre from "hardhat";

const ADMIN = "0xB95842A5E114f5D65b5B96aee42C025331C9417a"
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