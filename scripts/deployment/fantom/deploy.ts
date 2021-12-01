import {deploy} from "../common/deploy";

const POOLS = [
    { id: "hUSDC", token: "0x243e33aa7f6787154a8e59d3c27a66db3f8818ee", weight: 1 },
    { id: "hUSDT", token: "0xe4e43864ea18d5e5211352a4b810383460ab7fcc", weight: 1 },
    { id: "hMIM", token: "0xa8cd5d59827514bcf343ec19f531ce1788ea48f8", weight: 1 },
    { id: "hFRAX", token: "0xb4300e088a3ae4e624ee5c71bc1822f68bb5f2bc", weight: 1 },
    { id: "hDAI", token: "0x8e15a22853a0a60a0fbb0d875055a8e66cff0235", weight: 1 },
]

const HUNDRED_TOKEN = "0x10010078a54396F62c96dF8532dc2B4847d47ED3";

deploy(HUNDRED_TOKEN, POOLS, "fantom")
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });