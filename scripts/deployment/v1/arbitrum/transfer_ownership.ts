import {transferOwnership} from "../common/deploy";

transferOwnership("0xb982841d8Caf7cCc1b5c8ec414347316F54A06c9", "arbitrum")
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});