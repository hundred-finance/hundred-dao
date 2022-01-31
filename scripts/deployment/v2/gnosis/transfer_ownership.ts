import {transferOwnership} from "../common/deploy";

transferOwnership("new-owner", "gnosis")
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});