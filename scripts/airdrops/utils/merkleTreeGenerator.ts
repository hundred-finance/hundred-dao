import fs from "fs"; // Filesystem
import keccak256 from "keccak256"; // Keccak256 hashing
import MerkleTree from "merkletreejs"; // MerkleTree.js
import { getAddress, solidityKeccak256 } from "ethers/lib/utils"; // Ethers utils

// Airdrop recipient addresses and scaled token values
type AirdropRecipient = {
    // Recipient address
    address: string;
    // Scaled-to-decimals token value
    value: string;
};

export default class Generator {
    // Airdrop recipients
    recipients: AirdropRecipient[] = [];
    outputPath: string;

    /**
     * Setup generator
     * @param {Record<string, number>} airdrop address to token claim mapping
     * @param {string} outputPath path where to write the generated merkle tree
     */
    constructor(airdrop: Record<string, string>, outputPath: string) {
        this.outputPath = outputPath;

        // For each airdrop entry
        for (const [address, tokens] of Object.entries(airdrop)) {
            // Push:
            this.recipients.push({
                address: getAddress(address),
                value: tokens
            });
        }
    }

    /**
     * Generate Merkle Tree leaf from address and value
     * @param {string} address of airdrop claimee
     * @param {string} value of airdrop tokens to claimee
     * @returns {Buffer} Merkle Tree node
     */
    generateLeaf(address: string, value: string): Buffer {
        return Buffer.from(
            // Hash in appropriate Merkle format
            solidityKeccak256(["address", "uint256"], [address, value]).slice(2),
            "hex"
        );
    }

    async process(): Promise<void> {
        console.info("Generating Merkle tree.");

        // Generate merkle tree
        const merkleTree = new MerkleTree(
            // Generate leafs
            this.recipients.map(({ address, value }) =>
                this.generateLeaf(address, value)
            ),
            // Hashing function
            keccak256,
            { sortPairs: true }
        );

        // Collect and log merkle root
        const merkleRoot: string = merkleTree.getHexRoot();
        console.info(`Generated Merkle root: ${merkleRoot}`);

        // Collect and save merkle tree + root
        await fs.writeFileSync(
            // Output to merkle.json
            this.outputPath,
            // Root + full tree
            JSON.stringify({
                root: merkleRoot,
                tree: merkleTree
            }, null, 4)
        );
        console.info("Generated merkle tree and root saved to Merkle.json.");
    }
}