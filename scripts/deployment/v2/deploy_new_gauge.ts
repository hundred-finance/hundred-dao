import {deployNewGauge} from "./helpers";
import hre from "hardhat";

const network = hre.hardhatArguments.network;
if (!network) {
    console.error("please provide valid network");
} else {
    deployNewGauge(
        "0x8286dC6dF929C4BfA4f6951caB4dAe2EC02d4D72",
        network,
        "0xb1c4426C86082D91a6c097fC588E5D5d8dD1f5a8",
        "hBUSD"
    )
        .then(() => process.exit(0))
        .catch(error => {
                console.error(error);
                process.exit(1);
        });
}