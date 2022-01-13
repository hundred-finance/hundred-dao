import {MerkleTree} from "merkletreejs";
import Airdrop from "./airdrop.json";
import {ethers} from "ethers";
import keccak256 from "keccak256";

const leaf: Buffer = generateLeaf("0x5aD911DA81B204627DF872780981b0d90F25C33f", "2010751138866072649728");

const merkleTree = new MerkleTree(
    Object.entries(Airdrop).map(([address, tokens]) =>
        generateLeaf(
            ethers.utils.getAddress(address),
            tokens
        )
    ),
    keccak256,
    { sortPairs: true }
);

function generateLeaf(address: string, value: string): Buffer {
    return Buffer.from(
        ethers.utils
            .solidityKeccak256(["address", "uint256"], [address, value])
            .slice(2),
        "hex"
    );
}

console.log("user:", "0x5aD911DA81B204627DF872780981b0d90F25C33f");
console.log("user airdrop:", "2010751138866072649728");
console.log("user leaf:", leaf);
console.log("hex proof:", merkleTree.getHexProof(leaf));