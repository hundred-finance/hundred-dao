import {ethers} from "hardhat";
import {ILayerZeroEndpoint} from "../../../../typechain";

const LAYER_ZERO_ENDPOINT = "0x93f54D755A063cE7bB9e6Ac47Eccc8e33411d706"

async function estimateFee(endpoint: string) {
    const contract = <ILayerZeroEndpoint>await ethers.getContractAt("ILayerZeroEndpoint", endpoint);
    const fee = await contract.estimateFees(
        10011,
        "0xc8e2C35b7C9CD784635B72df14179746B7C0f2a7",
        ethers.utils.defaultAbiCoder.encode(
            ["address", "uint256", "uint256", "uint256", "uint256"],
            ["0x8286dC6dF929C4BfA4f6951caB4dAe2EC02d4D72", 43113, 0, "100000000000000000000", 1773878400]
        ),
        false,
        ethers.utils.solidityPack(["uint16", "uint256"], [1, 500000])
    )
    console.log("fee estimation:", fee.nativeFee.toString());
}

estimateFee(LAYER_ZERO_ENDPOINT);