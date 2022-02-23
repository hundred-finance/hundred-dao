import {deployNewGauge} from "../common/deploy";

deployNewGauge(
    "0xD0Bb8e4E4Dd5FDCD5D54f78263F5Ec8f33da4C95",
    "fantom",
    "0xA33138a5A6A32d12b2Ac7Fc261378d6C6AB2eF90",
    "lUSDC"
)
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});