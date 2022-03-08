import {Deployment, deploySmartWalletChecker} from "../common/deploy";
import fs from "fs";

let deployName = "arbitrum"
let admin = "0xb982841d8Caf7cCc1b5c8ec414347316F54A06c9"
let deployments: Deployment = JSON.parse(fs.readFileSync(`./scripts/deployment/v1/${deployName}/deployments.json`).toString());

deploySmartWalletChecker(admin, deployName, deployments,false, true)
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

