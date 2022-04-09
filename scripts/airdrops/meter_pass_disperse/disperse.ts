import {ethers} from "hardhat";
import Balances from "./balances.json";
import {ERC20TOKEN} from "../../../typechain";

async function disperse() {
    const [deployer] = await ethers.getSigners();
    const token: ERC20TOKEN = <ERC20TOKEN>await ethers.getContractAt("ERC20TOKEN", "0xb8c2Eb8702e129c8feCfbFD6E55bB6b3330f30f1", deployer);
    for (let balance of Balances) {
        console.log("sending ", balance);
        let tx = await token.transfer(balance.address, ethers.utils.parseEther(`${balance.amount}`))
        await tx.wait()
    }
}

disperse()