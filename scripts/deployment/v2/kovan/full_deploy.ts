import {deploy} from "../helpers";
import hre from "hardhat";

const POOLS = [
    { id: "hETH", token: "0xfcd8570ad81e6c77b8d252bebeba62ed980bd64d" },
    { id: "hDAI", token: "0x89db3B59381bC06FE9BF74532Afd777e5F78Ef02" },
    { id: "hLINK", token: "0xb4300e088a3AE4e624EE5C71Bc1822F68BB5f2bc" },
]

const HUNDRED_TOKEN = "0x10010054c81c8c01951E6A631dD228bB02d8D1e5";
const ADMIN = "0x8286dC6dF929C4BfA4f6951caB4dAe2EC02d4D72"

const network = hre.hardhatArguments.network;
if (!network) {
    console.error("please provide valid network");
} else {
    deploy(HUNDRED_TOKEN, POOLS, network, ADMIN)
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}
