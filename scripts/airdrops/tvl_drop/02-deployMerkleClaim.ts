import {ethers} from "hardhat";
import {
    MerkleClaimMultipleERC20__factory,
} from "../../../typechain";
import {getChainName} from "../utils/helpers";
import MerkleTreeWithMultiValuesGenerator from "../utils/merkleTreeWithMultiValuesGenerator";
import Airdrop from "./airdrop.json";

const HUNDRED_SAFE = "0xD0Bb8e4E4Dd5FDCD5D54f78263F5Ec8f33da4C95";
const WFTM = "0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83";
const HND = "0x10010078a54396f62c96df8532dc2b4847d47ed3";

deployMerkleClaim()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

export async function deployMerkleClaim() {

    const [deployer] = await ethers.getSigners();
    const chainName = getChainName(await deployer.getChainId());
    const merkle = new MerkleTreeWithMultiValuesGenerator(Airdrop);

    const merkleRoot = await merkle.process();

    if (chainName !== "fantom") {
        console.error("Wrong chain, please use fantom !")
        return
    }

    const merkleClaimFactory: MerkleClaimMultipleERC20__factory =
        <MerkleClaimMultipleERC20__factory>await ethers.getContractFactory("MerkleClaimERC20");

    let merkleClaim = await merkleClaimFactory.deploy();
    await merkleClaim.deployed();

    let trx = await merkleClaim.setNewDrop(merkleRoot, [WFTM, HND]);
    await trx.wait();

    trx = await merkleClaim.transferOwnership(HUNDRED_SAFE);
    await trx.wait();

    console.log(`Merkle claim contract: ${merkleClaim.address}`)
}
