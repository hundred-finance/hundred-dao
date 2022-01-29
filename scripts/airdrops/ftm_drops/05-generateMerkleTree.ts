import Generator from "../utils/merkleTreeGenerator";

// Config file path
import Airdrop from "./airdrop-snapshot-2.json";

(async () => {
    const generator = new Generator(Airdrop, "./scripts/airdrops/merkleTree-snapshot-2.json");
    await generator.process();
})();