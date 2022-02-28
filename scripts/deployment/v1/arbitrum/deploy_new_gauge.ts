import {deployNewGauge} from "../common/deploy";

deployNewGauge(
    "0xb982841d8Caf7cCc1b5c8ec414347316F54A06c9",
    "arbitrum",
    "0x6bb6ebCf3aC808E26545d59EA60F27A202cE8586",
    "hDAI"
)
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});