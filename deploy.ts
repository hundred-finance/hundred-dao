import { ethers } from "ethers"
import * as artifact from "./artifacts/contracts/VotingEscrow.vy/VotingEscrow.json"
import * as dotenv from "dotenv";

dotenv.config();

const deploy = async () => {
    const provider = new ethers.providers.JsonRpcProvider(
        `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_ARBITRUM_API_KEY}`
    )
    const signer = new ethers.Wallet(process.env.ARBITRUM_MAINNET_PRIVATE_KEY!, provider)
    const factory = new ethers.ContractFactory(JSON.stringify(artifact.abi), artifact.bytecode, signer);
    const ve = await factory.deploy(
        "0x10010078a54396f62c96df8532dc2b4847d47ed3",
        "Voting Escrow HND",
        "veHND",
        "1.0.0"
    );
    await ve.deployed();
    console.log(ve.address);
}

deploy();