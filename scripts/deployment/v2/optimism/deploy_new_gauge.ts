import {deployNewGauge} from "../common/deploy";

deployNewGauge(
    "TO-SET-NEW-ADMIN",
    "optimism",
    "lp-token-address",
    "lp-token-symbol"
)
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});