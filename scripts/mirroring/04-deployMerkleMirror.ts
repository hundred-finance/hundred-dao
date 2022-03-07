import {ethers} from "hardhat";
import {
    MerkleMirrorMultipleLocks__factory,
} from "../../typechain";
import {getChainName} from "../airdrops/utils/helpers";
import Mirrors from "./data/mirrors.json";
import fs from "fs";
import path from "path";
import {Deployment} from "../deployment/v2/helpers";
import MerkleTreeMirrorsGenerator from "./merkleTreeMirrorsGenerator";

const HUNDRED_SAFEs: any = {
    "moonriver" : "0xBf3bD01bd5fB28d2381d41A8eF779E6aa6f0a811",
    "gnosis" : "0xB95842A5E114f5D65b5B96aee42C025331C9417a",
    "optimism" : "0x641f26c67A5D0829Ae61019131093B6a7c7d18a3",
};

deployMerkleMirror()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

export async function deployMerkleMirror() {

    const allowedChains = ["moonriver", "gnosis", "optimism"];

    const [deployer] = await ethers.getSigners();
    const chainId = await deployer.getChainId()
    const chainName = getChainName(chainId);
    const merkle = new MerkleTreeMirrorsGenerator(Mirrors);

    const merkleRoot = await merkle.process();

    if (!allowedChains.find(c => c === chainName)) {
        console.error(`Wrong chain, please use one of ${allowedChains.join(", ")} !`)
        return
    }

    let location = path.join(__dirname, `../deployment/v2/${chainName}/deployments.json`);
    let deployments: Deployment = JSON.parse(fs.readFileSync(location).toString());

    if (deployments.MirroredVotingEscrow) {
        const merkleMirrorFactory: MerkleMirrorMultipleLocks__factory =
            <MerkleMirrorMultipleLocks__factory>await ethers.getContractFactory("MerkleMirrorMultipleLocks");

        let merkleMirror = await merkleMirrorFactory.deploy(chainId, deployments.MirroredVotingEscrow);
        await merkleMirror.deployed();

        let trx = await merkleMirror.addMirrorEvent(merkleRoot);
        await trx.wait();

        trx = await merkleMirror.transferOwnership(HUNDRED_SAFEs[chainName]);
        await trx.wait();

        deployments.MerkleMirror = merkleMirror.address;

        fs.writeFileSync(location, JSON.stringify(deployments, null, 4));

        console.log(`Merkle mirror contract: ${merkleMirror.address}`)
    }
}
