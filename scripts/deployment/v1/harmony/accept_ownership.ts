import {acceptOwnership} from "../common/deploy";

acceptOwnership("harmony")
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});