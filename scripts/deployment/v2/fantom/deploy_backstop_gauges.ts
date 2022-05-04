import {deploy} from "../helpers";
import hre from "hardhat";

const POOLS: any = [
    { id: "bhUSDC", token: "0xD3f08B1c4861dacC3ce539B9F4748AA25dCb72aE", weight: 1 },
    { id: "bhUSDT", token: "0x7605aaA45344F91315E0C596Ab679159784F8b7b", weight: 1 },
    { id: "bhMIM", token: "0x3A87b540F7EaeC7b20902039818B5Ea78F984305", weight: 1 },
    { id: "bhFRAX", token: "0x1346e106b4E2558DAACd2E8207505ce7E31e05CA", weight: 1 },
    { id: "bhDAI", token: "0x01ba129F27df71ADfeDdf2447eFD8698B718D593", weight: 1 },
]

const HUNDRED_TOKEN = "0x10010078a54396F62c96dF8532dc2B4847d47ED3";
const ADMIN = "0xD0Bb8e4E4Dd5FDCD5D54f78263F5Ec8f33da4C95"

const network = hre.hardhatArguments.network;
if (!network) {
    console.error("please provide valid network");
} else {
    deploy(HUNDRED_TOKEN, POOLS, network, ADMIN, "backstop-deployments")
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}
