import {deployHundredBond} from "../helpers";
import hre from "hardhat";

const HUNDRED_TOKEN = "0x10010078a54396F62c96dF8532dc2B4847d47ED3";
const ADMIN = "0xD0Bb8e4E4Dd5FDCD5D54f78263F5Ec8f33da4C95";

deployHundredBond(HUNDRED_TOKEN, ADMIN, "lendly-deployments")
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });