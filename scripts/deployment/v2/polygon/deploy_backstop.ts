import {deploy} from "../helpers";
import hre from "hardhat";

const POOLS: any = [
    { id: "bhDAI", token: "0x998Bf304Ce9Cb215F484aA39d1177b8210078f49", weight: 1 },
    { id: "bhUSDC", token: "0x0F0dD66D2d6c1f3b140037018958164c6AB80d56", weight: 1 },
    { id: "bhUSDT", token: "0x1EcF1b0DE9b4c2D01554062eA2faB84b1917B41d", weight: 1 },
    { id: "bhFRAX", token: "0x2DA13538056aFf0bFC81d3A4c6364B0a7e0f9feb", weight: 1 },
]

const HUNDRED_TOKEN = "0x10010078a54396F62c96dF8532dc2B4847d47ED3";
const ADMIN = "0xD0A27F0eBA2B407f2cCA8327b4Adb50BBAddFF24"
const LAYER_ZERO_ENDPOINT = "0x3c2269811836af69497E5F486A85D7316753cf62";

const network = hre.hardhatArguments.network;
if (!network) {
    console.error("please provide valid network");
} else {
    deploy(HUNDRED_TOKEN, POOLS, network, ADMIN, "backstop-deployments", LAYER_ZERO_ENDPOINT)
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}
