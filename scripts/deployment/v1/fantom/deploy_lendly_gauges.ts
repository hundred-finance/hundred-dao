import {deploy_lendly_gauges} from "../common/deploy";

const POOLS = [
    { id: "lUSDC", token: "0xA33138a5A6A32d12b2Ac7Fc261378d6C6AB2eF90" },
]

const ADMIN = "0xD0Bb8e4E4Dd5FDCD5D54f78263F5Ec8f33da4C95"
const HUNDRED_TOKEN = "0x10010078a54396F62c96dF8532dc2B4847d47ED3";

deploy_lendly_gauges("lendly", ADMIN, HUNDRED_TOKEN, POOLS, "fantom")
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });