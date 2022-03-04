import {deploy} from "../helpers";
import hre from "hardhat";

const POOLS: any = [
    { id: "hUSDC", token: "0x951604A32e0DE8829bC7d72d5A73B4e386c07383", weight: 1 },
    { id: "hUSDT", token: "0x21A4961B11c940fbeF57b1EB64FD646c880377e4", weight: 1 },
    { id: "hMIM", token: "0xa8A00134d1D10Ad5886Fc4f70F7F3C8Da83D7Ab4", weight: 1 },
    { id: "hFRAX", token: "0x30D0a2a680181643C3283A195d2f4898eB5Bf01C", weight: 1 },
]

const HUNDRED_TOKEN = "0x10010078a54396F62c96dF8532dc2B4847d47ED3";
const ADMIN = "0xBf3bD01bd5fB28d2381d41A8eF779E6aa6f0a811"

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
