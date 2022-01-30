import {transferOwnership} from "../common/deploy";

transferOwnership("0xD0Bb8e4E4Dd5FDCD5D54f78263F5Ec8f33da4C95", "fantom")
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});