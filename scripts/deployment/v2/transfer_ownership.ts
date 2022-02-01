import {transferOwnership} from "./helpers";
import hre from "hardhat";

const network = hre.hardhatArguments.network;
if (!network) {
        console.error("please provide valid network");
} else {
        transferOwnership("new-owner", network)
            .then(() => process.exit(0))
            .catch(error => {
                console.error(error);
                process.exit(1);
        });
}
