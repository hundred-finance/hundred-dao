import {deploy} from "../common/deploy";

const POOLS = [
    { id: "hUSDC", token: "0x8e15a22853A0A60a0FBB0d875055A8E66cff0235", weight: 1 },
    { id: "hUSDT", token: "0xfCD8570AD81e6c77b8D252bEbEBA62ed980BD64D", weight: 1 },
]

const HUNDRED_TOKEN = "0x10010078a54396F62c96dF8532dc2B4847d47ED3";

deploy(HUNDRED_TOKEN, POOLS, "harmony")
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });