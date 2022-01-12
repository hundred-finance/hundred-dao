import {ethers} from "hardhat";
import {
    MerkleClaimERC20__factory,
} from "../../typechain";
import {getChainName} from "./utils/helpers";
import MerkleTree from "./merkleTree.json";

const WFTM = "0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83";

deployMerkleClaim()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

export async function deployMerkleClaim() {

    const [deployer] = await ethers.getSigners();
    const chainName = getChainName(await deployer.getChainId());

    if (chainName !== "fantom") {
        console.error("Wrong chain, please use fantom !")
        return
    }

    const merkleClaimFactory: MerkleClaimERC20__factory =
        <MerkleClaimERC20__factory>await ethers.getContractFactory("MerkleClaimERC20");

    let merkleClaim = await merkleClaimFactory.deploy(MerkleTree.root, WFTM);
    await merkleClaim.deployed();

    console.log(`Merkle claim contract: ${merkleClaim.address}`)
}
