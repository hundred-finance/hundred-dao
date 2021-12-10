import {transferOwnership} from "../common/deploy";

transferOwnership("TO-FILL", "moonriver")
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});