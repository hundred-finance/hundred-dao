import { expect } from "chai";
import { ethers } from 'hardhat';
import MerkleTreeWithMultiValuesGenerator from "../scripts/airdrops/utils/merkleTreeWithMultiValuesGenerator";

import {
    ERC20TOKEN__factory,
    ERC20TOKEN, MerkleClaimMultipleERC20, MerkleClaimMultipleERC20__factory
} from "../typechain";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

describe("MerkleClaimMultipleER20 contract", function () {

    let merkleClaimFactory: MerkleClaimMultipleERC20__factory;
    let erc20Factory: ERC20TOKEN__factory;

    let merkleClaim: MerkleClaimMultipleERC20;
    let claimToken1: ERC20TOKEN;
    let claimToken2: ERC20TOKEN;

    let owner: SignerWithAddress;
    let alice: SignerWithAddress;
    let bob: SignerWithAddress;
    let eve: SignerWithAddress;

    let eligibleUser = "0x5aD911DA81B204627DF872780981b0d90F25C33f";
    let airdrop: any = {
        "0x5aD911DA81B204627DF872780981b0d90F25C33f" : [
            "2010751138866072649728",
            "100100100100100100100"
        ]
    };
    let merkleRoot: string;
    let hexProof: string[];

    beforeEach(async function () {
        [owner, alice, bob, eve] =
            await ethers.getSigners();

        let merkleTree = new MerkleTreeWithMultiValuesGenerator(airdrop);
        merkleRoot = await merkleTree.process();
        hexProof = merkleTree.generateProof(eligibleUser, airdrop[eligibleUser]);

        merkleClaimFactory = <MerkleClaimMultipleERC20__factory>await ethers.getContractFactory("MerkleClaimMultipleERC20");
        erc20Factory = <ERC20TOKEN__factory>await ethers.getContractFactory("ERC20TOKEN");

        claimToken1 = await erc20Factory.deploy("CLAIM1", "CLM1", 18, 0);
        claimToken2 = await erc20Factory.deploy("CLAIM2", "CLM2", 18, 0);
        merkleClaim = await merkleClaimFactory.deploy();

        await merkleClaim.setNewDrop(merkleRoot, [claimToken1.address, claimToken2.address]);

        await claimToken1.mint(merkleClaim.address, ethers.utils.parseEther("10000"));
        await claimToken2.mint(merkleClaim.address, ethers.utils.parseEther("10000"));
    });

    describe("Administrating contract", function () {

        it("Non admin should not be able to call pause", async function () {
            expect(merkleClaim.connect(alice).pause())
                .to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Non admin should not be able to call pause", async function () {
            expect(merkleClaim.connect(alice).unPause())
                .to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Non admin should not be able to call sweepRemainingFunds", async function () {
            expect(merkleClaim.connect(alice).sweepUnclaimedFunds(claimToken1.address))
                .to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Admin can call pause and unpause on contract", async function () {
            await merkleClaim.connect(owner).pause();
            expect(await merkleClaim.paused()).to.be.equals(true);

            await merkleClaim.connect(owner).unPause();
            expect(await merkleClaim.paused()).to.be.equals(false);
        });

        it("Admin can call sweepRemainingFunds on contract", async function () {
            await merkleClaim.connect(owner).sweepUnclaimedFunds(claimToken1.address);

            expect(await claimToken1.balanceOf(merkleClaim.address)).to.be.equals(0);
            expect(await claimToken1.balanceOf(owner.address)).to.be.equals(ethers.utils.parseEther("10000"));
        });

    });

    describe("Claiming", function () {

        it("Should fail for eligible user with valid proof and invalid amount", async function () {
            expect(merkleClaim.claim(eligibleUser, ["11111111111"], hexProof, 0))
                .to.be.revertedWith("Not Valid Merkle proof");
        });

        it("Should succeed for eligible user with valid proof and invalid amount", async function () {
            await merkleClaim.claim(eligibleUser, airdrop[eligibleUser], hexProof, 0);
            expect(await claimToken1.balanceOf(eligibleUser)).to.be.equals(airdrop[eligibleUser][0]);
            expect(await claimToken2.balanceOf(eligibleUser)).to.be.equals(airdrop[eligibleUser][1]);
        });

        it("Should fail for eligible user if drop is closed", async function () {
            await merkleClaim.connect(owner).closeDrop(0);
            expect(merkleClaim.claim(eligibleUser, airdrop[eligibleUser], hexProof, 0))
                .to.be.revertedWith("Drop is closed");
        });

        it("Should fail for non eligible user with valid proof", async function () {
            expect(merkleClaim.claim(alice.address, airdrop[eligibleUser], hexProof, 0))
                .to.be.revertedWith("Not Valid Merkle proof");
        });

        it("Should fail for eligible user with invalid proof", async function () {
            expect(merkleClaim.claim(eligibleUser, airdrop[eligibleUser], hexProof.slice(1), 0))
                .to.be.revertedWith("Not Valid Merkle proof");
        });

    });

});