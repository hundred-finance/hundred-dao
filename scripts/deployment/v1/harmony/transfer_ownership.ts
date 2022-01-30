import {transferOwnership} from "../common/deploy";

transferOwnership("0xC79354D37BD6B290Acc52C58798ACaa3CecD0b1B", "harmony")
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});