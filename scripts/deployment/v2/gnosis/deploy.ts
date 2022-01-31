import {deploy} from "../common/deploy";

const POOLS: any = [
]

const HUNDRED_TOKEN = "0x10010078a54396F62c96dF8532dc2B4847d47ED3";

deploy(HUNDRED_TOKEN, POOLS, "gnosis")
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });