import hre, {ethers} from "hardhat";
import {ILayerZeroEndpoint, MirrorGate, VotingEscrow} from "../../../typechain";
import path from "path";
import fs from "fs";

const USER = ""
const FLAVOR = "lendly-deployments"

// to get from https://layerzero.gitbook.io/docs/technical-reference/mainnet/supported-chain-ids
const LAYER_ZERO_ENDPOINT = "0xb6319cC6c8c27A8F5dAF0dD3DF91EA35C4720dd7"
const TARGET_ENDPOINT_ID = 10

async function estimateFee(user: string, endpoint: string, targetChainId: number, flavor: string) {
    const network = hre.hardhatArguments.network;
    const [deployer] = await ethers.getSigners();
    const chainId = await deployer.getChainId();

    const location = path.join(__dirname, `/${network}/${flavor}.json`);
    const deployments = JSON.parse(fs.readFileSync(location).toString());

    const escrowContract = <VotingEscrow>await ethers.getContractAt(
        "VotingEscrow",
        deployments.VotingEscrowV2 ? deployments.VotingEscrowV2 : deployments.VotingEscrowV1
    );
    const gate = <MirrorGate>await ethers.getContractAt("MirrorGate", deployments.MirrorGate);
    const contract = <ILayerZeroEndpoint>await ethers.getContractAt("ILayerZeroEndpoint", endpoint)

    const lock = await escrowContract["locked(address)"](user);
    console.log("lock: ", lock.amount.toString(), lock.end.toString());

    const fee = await contract.estimateFees(
        targetChainId,
        deployments.MirrorGate,
        ethers.utils.defaultAbiCoder.encode(
            ["address", "uint256", "uint256", "uint256", "uint256"],
            [user, chainId, 0, lock.amount.toString(), lock.end]
        ),
        false,
        ethers.utils.solidityPack(["uint16", "uint256"], [1, 500000])
    )
    console.log("target gate:", await gate.mirrorGates(targetChainId));
    console.log("fee estimation:", fee.nativeFee.toString());
}

estimateFee(
    USER,
    LAYER_ZERO_ENDPOINT,
    TARGET_ENDPOINT_ID,
    FLAVOR
);