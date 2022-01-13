import Generator from "./utils/merkleTreeGenerator";

// Config file path
import Airdrop from "./airdrop.json";

(async () => {
    const generator = new Generator(Airdrop, "./scripts/users/merkleTree.json");
    await generator.process();
})();