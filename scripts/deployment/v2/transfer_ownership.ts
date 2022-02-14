import {transferOwnership} from "./helpers";
import hre from "hardhat";

const network = hre.hardhatArguments.network;
if (!network) {
        console.error("please provide valid network");
} else {
        transferOwnership("0xBf3bD01bd5fB28d2381d41A8eF779E6aa6f0a811", network)
            .then(() => process.exit(0))
            .catch(error => {
                console.error(error);
                process.exit(1);
        });
}
