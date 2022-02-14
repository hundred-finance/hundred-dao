import {transferOwnership} from "./helpers";
import hre from "hardhat";

const network = hre.hardhatArguments.network;
if (!network) {
        console.error("please provide valid network");
} else {
        transferOwnership("0xB95842A5E114f5D65b5B96aee42C025331C9417a", network)
            .then(() => process.exit(0))
            .catch(error => {
                console.error(error);
                process.exit(1);
        });
}
