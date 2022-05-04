import {deploy, initGaugesAndTreasury} from "../helpers";
import hre from "hardhat";

const POOLS: any = [
    { id: "bhBUSD", token: "0x4Db1d29eA5b51dDADcc5Ab26709dDA49e7eB1E71", weight: 1 },
    { id: "bhUSDT", token: "0x8cF0B1c886Ee522427ef57F5601689352F8161eb", weight: 1 },
    { id: "bhUSDC", token: "0x7D30d048F8693aF30A10aa5D6d281A7A7E6E1245", weight: 1 },
    { id: "bhDAI", token: "0xCE0A876996248421606F4ad8a09B1D3E15f69EfB", weight: 1 },
]

const HUNDRED_TOKEN = "0xe0a6D4684aabBE8C08a57b3A4B54855C08165c1D";
const ADMIN = "0x8286dC6dF929C4BfA4f6951caB4dAe2EC02d4D72"

const network = hre.hardhatArguments.network;
if (!network) {
    console.error("please provide valid network");
} else {
    deploy(HUNDRED_TOKEN, POOLS, network, ADMIN, "backstop-gauges-deployments")
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });

    initGaugesAndTreasury(network, "backstop-gauges-deployments");
}
