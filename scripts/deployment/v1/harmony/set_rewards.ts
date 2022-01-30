import {setRewardsStartingAt} from "../common/deploy";
import {BigNumber, ethers} from "ethers";

const reward = ethers.utils.parseEther("100000")

setRewardsStartingAt(
    "harmony",
    4, [
            reward, reward, reward, reward,
            BigNumber.from(0), BigNumber.from(0), BigNumber.from(0),BigNumber.from(0),
            BigNumber.from(0), BigNumber.from(0)
    ]
)
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});