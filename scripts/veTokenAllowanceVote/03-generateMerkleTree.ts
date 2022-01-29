import Generator from "../airdrops/utils/merkleTreeGenerator";

import {ethers} from "hardhat";
import {getChainName} from "../airdrops/utils/helpers";

(async () => {
    const [deployer] = await ethers.getSigners();
    const chainName = getChainName(await deployer.getChainId());

    const snapshot = await import(`./scripts/veTokenAllowanceVote/balances/${chainName}.json`);

    const generator = new Generator(snapshot, `./scripts/veTokenAllowanceVote/merkleTrees/${chainName}.json`);
    await generator.process();
})();