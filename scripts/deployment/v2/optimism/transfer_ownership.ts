import {transferOwnership} from "../common/deploy";

transferOwnership("new-owner", "optimism")
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});