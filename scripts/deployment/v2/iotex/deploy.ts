import {deploy, initGaugesAndTreasury, whiteListMirrorGates} from "../helpers";
import hre from "hardhat";

const POOLS: any = [
    { id: "hDAI", token: "0xa8236EaFBAF1C3D39396DE566cEEa6F320E3db00", weight: 1 },
    { id: "hUSDC", token: "0x607312a5C671D0C511998171e634DE32156e69d0", weight: 1 },
    { id: "hUSDT", token: "0xb4300e088a3AE4e624EE5C71Bc1822F68BB5f2bc", weight: 1 },
    { id: "hBUSD", token: "0x8e15a22853A0A60a0FBB0d875055A8E66cff0235", weight: 1 },
]

const HUNDRED_TOKEN = "0xe0a6D4684aabBE8C08a57b3A4B54855C08165c1D";
const ADMIN = "0x8286dC6dF929C4BfA4f6951caB4dAe2EC02d4D72"
const MULTICHAIN_ENDPOINT = "0xC10Ef9F491C9B59f936957026020C321651ac078";

const network = hre.hardhatArguments.network;
if (!network) {
    console.error("please provide valid network");
} else {
    deploy(HUNDRED_TOKEN, POOLS, network, ADMIN, "deployments", "", MULTICHAIN_ENDPOINT)
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });

    // initGaugesAndTreasury(network);

    // whiteListMirrorGates(network);
}
