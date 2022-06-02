import {deployVeGno} from "../helpers";
import hre from "hardhat";

const GNO_TOKEN = "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb";
const ADMIN = "0xB95842A5E114f5D65b5B96aee42C025331C9417a";
const unlockTime = 1647302400; // 15 March 2022

const network = hre.hardhatArguments.network;
if (!network) {
    console.error("please provide valid network");
} else {
    deployVeGno(GNO_TOKEN, unlockTime, ADMIN)
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}
