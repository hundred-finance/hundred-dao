import {transferOwnership} from "../common/deploy";

transferOwnership("TO-SET-NEW-ADMIN", "arbitrum_mainnet")
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});