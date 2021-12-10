import {deploy} from "../common/deploy";

const POOLS = [
    { id: "hMIM", token: "0x090a00A2De0EA83DEf700B5e216f87a5D4F394FE", weight: 1 },
    { id: "hFRAX", token: "0x8e15a22853A0A60a0FBB0d875055A8E66cff0235", weight: 1 },
    { id: "hUSDT", token: "0xbb93C7F378B9b531216f9aD7b5748be189A55807", weight: 1 },
]

const HUNDRED_TOKEN = "0x10010078a54396F62c96dF8532dc2B4847d47ED3";

deploy(HUNDRED_TOKEN, POOLS, "moonriver")
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });