import {deployNewGauge} from "./helpers";
import hre from "hardhat";

const network = hre.hardhatArguments.network;
if (!network) {
    console.error("please provide valid network");
} else {
    deployNewGauge(
        "TO-SET-NEW-ADMIN",
        network,
        "lp-token-address",
        "lp-token-symbol"
    )
        .then(() => process.exit(0))
        .catch(error => {
                console.error(error);
                process.exit(1);
        });
}