import {deploy} from "../common/deploy";

const POOLS = [
    { id: "hUSDC", token: "0xfcd8570ad81e6c77b8d252bebeba62ed980bd64d", weight: 1 },
    { id: "hUSDT", token: "0x607312a5c671d0c511998171e634de32156e69d0", weight: 1 },
    { id: "hMIM", token: "0x376020c5b0ba3fd603d7722381faa06da8078d8a", weight: 1 },
    { id: "hFRAX", token: "0xb1c4426c86082d91a6c097fc588e5d5d8dd1f5a8", weight: 1 },
]

const HUNDRED_TOKEN = "0x10010078a54396F62c96dF8532dc2B4847d47ED3";

deploy(HUNDRED_TOKEN, POOLS, "arbitrum")
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });