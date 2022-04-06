import {deployHundredBond} from "../helpers";

const HUNDRED_TOKEN = "0x10010078a54396F62c96dF8532dc2B4847d47ED3";
const ADMIN = "0xBf3bD01bd5fB28d2381d41A8eF779E6aa6f0a811"

deployHundredBond(HUNDRED_TOKEN, ADMIN)
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });