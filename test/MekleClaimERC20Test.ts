import { expect } from "chai";
import { ethers } from 'hardhat';

import {
    ERC20TOKEN__factory,
    ERC20TOKEN, MerkleClaimERC20__factory, MerkleClaimERC20
} from "../typechain";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

describe("MerkleClaimER20 contract", function () {

    let merkleClaimFactory: MerkleClaimERC20__factory;
    let erc20Factory: ERC20TOKEN__factory;

    let merkleClaim: MerkleClaimERC20;
    let claimToken: ERC20TOKEN;

    let owner: SignerWithAddress;
    let alice: SignerWithAddress;
    let bob: SignerWithAddress;
    let eve: SignerWithAddress;

    let merkleRoot = "0x16c9e2d7578479d67c9ecd1e1ba16af5aaa20300cc2c537d97553cd1904b3fa0"
    let eligibleUser = "0x5aD911DA81B204627DF872780981b0d90F25C33f";
    let claimAmount = "2010751138866072649728";
    let hexProof = [
        '0x95deb9455b3c3f4baec017d240dc3bc4b7483caf4805040337f23465dc3f99ee',
        '0x7b7ca3e2d2a8847c077b829bc26cd8621a8d4371efe29a156b6681531cb0c337',
        '0x213643ad0ae36d8cb2aa979d247588211dcd6c14ad4d8759fe4775a5f221cfa6',
        '0x2d89206de5e137a59b816e0751d43a2c08a9296261fd967d7545e129bc29999d',
        '0x2f4a4a4a79dbe3bf57b8064487bb8f979b0a63860069d36dfc6480f2edef1eb2',
        '0x38817b28004c5b6e297216eb2419a0c8d5e286a3d59db5de6dfa326a55a04817',
        '0x0beb2ed5e322e100288ff934384692ec7ac48db9614673c7c493708ad43d11de',
        '0x393f1b7d3774f587dea91b19ef6d3f6b38bf092842b10571b61da347206719ac',
        '0x5aa62198b9a8fa9802083eda6be6a48fb875e64598aa5e957110ed2ddf2b4e70',
        '0x4a32d5a1751c6563bf8d13d198f6e0137dcc29d9818e86507341817fbd94d45d'
    ];

    beforeEach(async function () {
        [owner, alice, bob, eve] =
            await ethers.getSigners();

        merkleClaimFactory = <MerkleClaimERC20__factory>await ethers.getContractFactory("MerkleClaimERC20");
        erc20Factory = <ERC20TOKEN__factory>await ethers.getContractFactory("ERC20TOKEN");

        claimToken = await erc20Factory.deploy("CLAIM", "CLM", 18, 0);
        merkleClaim = await merkleClaimFactory.deploy(merkleRoot, claimToken.address);

        await claimToken.mint(merkleClaim.address, ethers.utils.parseEther("10000"));
    });

    describe("Administrating contract", function () {

        it("Non admin should not be able to call pause", async function () {
            await expect(merkleClaim.connect(alice).pause())
                .to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Non admin should not be able to call pause", async function () {
            await expect(merkleClaim.connect(alice).unPause())
                .to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Non admin should not be able to call sweepRemainingFunds", async function () {
            await expect(merkleClaim.connect(alice).sweepRemainingFunds())
                .to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Admin can call pause and unpause on contract", async function () {
            await merkleClaim.connect(owner).pause();
            expect(await merkleClaim.paused()).to.be.equals(true);

            await merkleClaim.connect(owner).unPause();
            expect(await merkleClaim.paused()).to.be.equals(false);
        });

        it("Admin can call sweepRemainingFunds on contract", async function () {
            await merkleClaim.connect(owner).sweepRemainingFunds();

            expect(await claimToken.balanceOf(merkleClaim.address)).to.be.equals(0);
            expect(await claimToken.balanceOf(owner.address)).to.be.equals(ethers.utils.parseEther("10000"));
        });

    });

    describe("Claiming", function () {
        it("Should fail for non eligible user with valid proof", async function () {
            await expect(merkleClaim.claim(alice.address, claimAmount, hexProof))
                .to.be.revertedWith("Not Valid Merkle proof");
        });

        it("Should fail for eligible user with invalid proof", async function () {
            await expect(merkleClaim.claim(eligibleUser, claimAmount, hexProof.slice(1)))
                .to.be.revertedWith("Not Valid Merkle proof");
        });

        it("Should fail for eligible user with valid proof and invalid amount", async function () {
            await expect(merkleClaim.claim(eligibleUser, "11111111111", hexProof))
                .to.be.revertedWith("Not Valid Merkle proof");
        });

        it("Should succeed for eligible user with valid proof and invalid amount", async function () {
            await merkleClaim.claim(eligibleUser, claimAmount, hexProof);
            expect(await claimToken.balanceOf(eligibleUser)).to.be.equals(claimAmount);
        });
    });

});