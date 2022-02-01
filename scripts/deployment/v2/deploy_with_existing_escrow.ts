import {deploy} from "./helpers";
import hre from "hardhat";

const POOLS: any = [
    { id: "hETH", token: "0xfcd8570ad81e6c77b8d252bebeba62ed980bd64d", weight: 1 },
]

const HUNDRED_TOKEN = "0x10010054c81c8c01951E6A631dD228bB02d8D1e5";
const veHND = "0xbeD8EFa1973F6E1fB3515bf94aa760174431b3F8";

const network = hre.hardhatArguments.network;
if (!network) {
    console.error("please provide valid network");
} else {
    deploy(HUNDRED_TOKEN, POOLS, network, veHND)
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}
