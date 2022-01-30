import {deployNewGauge} from "../common/deploy";

deployNewGauge(
    "0xb16a11442878d6f1ef202ae63233a7c13e98fd7f",
    "moonriver",
    "0xB426c1b7fABEa9EA6A273E8427040568a8C7DF13",
    "hUSDC"
)
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});