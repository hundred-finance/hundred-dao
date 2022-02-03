import {deployNewGauge} from "../common/deploy";

deployNewGauge(
    "0xD0Bb8e4E4Dd5FDCD5D54f78263F5Ec8f33da4C95",
    "fantom",
    "0xA9AA802429772626Fccd91d9B6A6b955BD811fF3",
    "hUST"
)
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});