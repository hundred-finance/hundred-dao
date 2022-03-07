import keccak256 from "keccak256"; // Keccak256 hashing
import MerkleTree from "merkletreejs"; // MerkleTree.js
import {getAddress, solidityKeccak256} from "ethers/lib/utils"; // Ethers utils

// Airdrop recipient addresses and scaled token values
type AirdropRecipient = {
    // Recipient address
    address: string;
    // Scaled-to-decimals token value
    values: string[];
};

export default class MerkleTreeMirrorsGenerator {
    // Airdrop recipients
    recipients: AirdropRecipient[] = [];
    tree: MerkleTree = new MerkleTree([]);

    constructor(mirrors: string[][]) {
        for (const mirror of mirrors) {
            this.recipients.push({
                address: getAddress(mirror[0]),
                values: mirror.slice(1)
            });
        }
    }

    /**
     * Generate Merkle Tree leaf from address and value
     * @param {string} address of airdrop claimee
     * @param {string} values of airdrop tokens to claimee
     * @returns {Buffer} Merkle Tree node
     */
    generateLeaf(address: string, values: string[]): Buffer {
        return Buffer.from(
            // Hash in appropriate Merkle format
            solidityKeccak256(
                ["address", "uint256", "uint256", "uint256", "uint256"],
                [address, values[0], values[1], values[2], values[3]]
            ).slice(2),
            "hex"
        );
    }

    async process(): Promise<string> {
        // Generate merkle tree
        this.tree = new MerkleTree(
            // Generate leafs
            this.recipients.map(({ address, values }) =>
                this.generateLeaf(address, values)
            ),
            // Hashing function
            keccak256,
            { sortPairs: true }
        );

        return this.tree.getHexRoot();
    }

    generateProof(address: string, values: string[]): string[] {
        return this.tree.getHexProof(this.generateLeaf(address, values));
    }
}