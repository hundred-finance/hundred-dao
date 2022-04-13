import {deployHundredBond} from "../helpers";
import hre from "hardhat";

const HUNDRED_TOKEN = "0x10010078a54396F62c96dF8532dc2B4847d47ED3";
const ADMIN = "0xD0A27F0eBA2B407f2cCA8327b4Adb50BBAddFF24"

deployHundredBond(HUNDRED_TOKEN, ADMIN, "deployments")
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });