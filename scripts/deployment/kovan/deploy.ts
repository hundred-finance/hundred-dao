import {deploy} from "../common/deploy";

const POOLS = [
    { id: "hETH", token: "0xfcd8570ad81e6c77b8d252bebeba62ed980bd64d", weight: 1 },
]

const HUNDRED_TOKEN = "0x10010054c81c8c01951E6A631dD228bB02d8D1e5";

deploy(HUNDRED_TOKEN, POOLS, "kovan")
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });