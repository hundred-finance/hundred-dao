import {Deployment, deploySmartWalletChecker} from "../common/deploy";
import fs from "fs";

let deployName = "fantom"
let fantomMultisig = "0xD0Bb8e4E4Dd5FDCD5D54f78263F5Ec8f33da4C95"
let deployments: Deployment = JSON.parse(fs.readFileSync(`./scripts/deployment/${deployName}/deployments.json`).toString());

deploySmartWalletChecker(fantomMultisig, deployName, deployments,false, true)
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

