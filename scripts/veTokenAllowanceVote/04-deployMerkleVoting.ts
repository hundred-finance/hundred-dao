import {ethers} from "hardhat";
import {
    MerkleVoting__factory,
} from "../../typechain";
import {getChainName} from "../users/utils/helpers";

const START_TIMESTAMP = 0
const END_TIMESTAMP = 0

deployMerkleVoting()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

export async function deployMerkleVoting() {

    const [deployer] = await ethers.getSigners();
    const chainName = getChainName(await deployer.getChainId());
    const merkleTree = await import(`./scripts/veTokenAllowanceVote/merkleTrees/${chainName}.json`);

    const merkleVotingFactory: MerkleVoting__factory =
        <MerkleVoting__factory>await ethers.getContractFactory("MerkleVoting");

    let merkleVote = await merkleVotingFactory.deploy(merkleTree.root, START_TIMESTAMP, END_TIMESTAMP);
    await merkleVote.deployed();

    console.log(`Merkle vote contract: ${merkleVote.address}`)
}
