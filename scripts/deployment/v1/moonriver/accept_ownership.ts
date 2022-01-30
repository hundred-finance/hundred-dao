import {acceptOwnership} from "../common/deploy";

acceptOwnership("moonriver")
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});