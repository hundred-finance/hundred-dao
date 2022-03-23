import { expect } from "chai";
import { ethers } from 'hardhat';
import {
    VotingEscrowV2,
    VotingEscrowV2__factory,
    ERC20TOKEN,
    ERC20TOKEN__factory,
    VotingEscrow__factory,
    VotingEscrow,
    HundredBond__factory,
    HundredBond,
    SmartWalletChecker__factory,
    SmartWalletChecker
} from "../typechain";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

const WEEK = 7 * 86400

describe("HundredBond contract", function () {

    let hndFactory: ERC20TOKEN__factory;
    let votingEscrowV2Factory: VotingEscrowV2__factory;
    let votingEscrowV1Factory: VotingEscrow__factory;
    let hundredBondFactory: HundredBond__factory;
    let smartWalletCheckerFactory: SmartWalletChecker__factory;

    let hnd: ERC20TOKEN;
    let votingEscrowV2: VotingEscrowV2;
    let votingEscrowV1: VotingEscrow;
    let hundredBondV1: HundredBond;
    let hundredBondV2: HundredBond;
    let smartWalletChecker: SmartWalletChecker;

    let owner: SignerWithAddress;
    let alice: SignerWithAddress;

    beforeEach(async function () {
        [owner, alice] =
            await ethers.getSigners();

        hndFactory = <ERC20TOKEN__factory>await ethers.getContractFactory("ERC20TOKEN");
        votingEscrowV2Factory = <VotingEscrowV2__factory>await ethers.getContractFactory("VotingEscrowV2");
        votingEscrowV1Factory = <VotingEscrow__factory>await ethers.getContractFactory("VotingEscrow");
        hundredBondFactory = <HundredBond__factory>await ethers.getContractFactory("HundredBond");
        smartWalletCheckerFactory = <SmartWalletChecker__factory> await ethers.getContractFactory("SmartWalletChecker");

        hnd = await hndFactory.deploy("HND", "HND", 18, 0);
        smartWalletChecker = await smartWalletCheckerFactory.deploy(owner.address);
        votingEscrowV2 = await votingEscrowV2Factory.deploy(
            hnd.address, "veHND", "veHND", "2.0", owner.address,
            "0x0000000000000000000000000000000000000000",
            smartWalletChecker.address
        );
        votingEscrowV1 = await votingEscrowV1Factory.deploy(hnd.address, "veHND", "veHND", "1.0");
        hundredBondV1 = await hundredBondFactory.deploy(hnd.address, votingEscrowV1.address, false, 200 * WEEK);
        hundredBondV2 = await hundredBondFactory.deploy(hnd.address, votingEscrowV2.address, true, 200 * WEEK);

        await smartWalletChecker.add_to_whitelist(hundredBondV2.address);
    });

    describe("Administrating contract", function () {

        it("Non admin should not be able to call pause", async function () {
            await expect(hundredBondV1.connect(alice).pause())
                .to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Non admin should not be able to call pause", async function () {
            await expect(hundredBondV1.connect(alice).unPause())
                .to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Non admin should not be able to call rescue", async function () {
            await expect(hundredBondV1.connect(alice).rescueHnd())
                .to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Admin can call pause and unpause on contract", async function () {
            await hundredBondV1.connect(owner).pause();
            expect(await hundredBondV1.paused()).to.be.equals(true);

            await hundredBondV1.connect(owner).unPause();
            expect(await hundredBondV1.paused()).to.be.equals(false);
        });

    });

    describe("Minting", function () {

        it("Should fail when mint is not called by owner", async function () {
            await expect(hundredBondV1.connect(alice).mint(alice.address, ethers.utils.parseEther("100")))
                .to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should fail when mint is called by owner but owner has not enough HND", async function () {
            await hnd.approve(hundredBondV1.address, ethers.utils.parseEther("100"));
            await expect(hundredBondV1.mint(alice.address, ethers.utils.parseEther("100")))
                .to.be.revertedWith("");
        });

        it("Should succeed when mint is called by owner but owner has enough HND", async function () {
            const amount = ethers.utils.parseEther("100");

            await hnd.mint(owner.address, amount);
            await hnd.approve(hundredBondV1.address, amount);
            await hundredBondV1.mint(alice.address, amount);

            expect(await hundredBondV1.balanceOf(alice.address)).to.be.equals(amount);
            expect(await hnd.balanceOf(hundredBondV1.address)).to.be.equals(amount);
        });

    });

    describe("Burning", function () {
        it("Should fail if user has no tokens", async function () {
            await expect(hundredBondV1.burn(ethers.utils.parseEther("100")))
                .to.be.revertedWith("ERC20: burn amount exceeds balance");
        });

        it("Should send HND back to owner when successful", async function () {
            const amount = ethers.utils.parseEther("100");
            const halfAmount = ethers.utils.parseEther("50");

            await hnd.mint(owner.address, amount);
            await hnd.approve(hundredBondV1.address, amount);
            await hundredBondV1.mint(alice.address, amount);

            await hundredBondV1.connect(alice).burn(halfAmount);

            expect(await hundredBondV1.balanceOf(alice.address)).to.be.equals(halfAmount);
            expect(await hnd.balanceOf(hundredBondV1.address)).to.be.equals(halfAmount);
            expect(await hnd.balanceOf(owner.address)).to.be.equals(halfAmount);
        });
    });

    describe("Redeeming", function () {
        it("Should fail if user has no tokens", async function () {
            await expect(hundredBondV1.redeem()).to.be.revertedWith("Insufficient bond balance to redeem");
        });

        it("Should fail if user has tokens but no created v1 lock", async function () {
            const amount = ethers.utils.parseEther("100");

            await hnd.mint(owner.address, amount);
            await hnd.approve(hundredBondV1.address, amount);
            await hundredBondV1.mint(alice.address, amount);

            await expect(hundredBondV1.connect(alice).redeem())
                .to.be.revertedWith("HND lock needs to be extended or created");
        });

        it("Should fail if user has tokens but created v1 lock will release in less than 200 weeks", async function () {
            const amount = ethers.utils.parseEther("100");

            await hnd.mint(owner.address, amount);
            await hnd.mint(alice.address, amount);

            await hnd.approve(hundredBondV1.address, amount);
            await hundredBondV1.mint(alice.address, amount);

            const blockNumBefore = await ethers.provider.getBlockNumber();
            const blockBefore = await ethers.provider.getBlock(blockNumBefore);

            await hnd.connect(alice).approve(votingEscrowV1.address, amount);
            await votingEscrowV1.connect(alice).create_lock(amount, blockBefore.timestamp + 150 * WEEK);

            await expect(hundredBondV1.connect(alice).redeem())
                .to.be.revertedWith("HND lock needs to be extended or created");
        });

        it("Should succeed if user has tokens but created v1 lock will release in more than 200 weeks", async function () {
            const amount = ethers.utils.parseEther("100");

            await hnd.mint(owner.address, amount);
            await hnd.mint(alice.address, amount);

            await hnd.approve(hundredBondV1.address, amount);
            await hundredBondV1.mint(alice.address, amount);

            const blockNumBefore = await ethers.provider.getBlockNumber();
            const blockBefore = await ethers.provider.getBlock(blockNumBefore);

            await hnd.connect(alice).approve(votingEscrowV1.address, amount);
            await votingEscrowV1.connect(alice).create_lock(amount, blockBefore.timestamp + 204 * WEEK);

            await hundredBondV1.connect(alice).redeem();

            const locked = await votingEscrowV1.locked(alice.address);
            expect(locked.amount).to.be.equals(amount.mul(2));
            expect(await hnd.balanceOf(hundredBondV1.address)).to.be.equals(0);
            expect(await hundredBondV1.balanceOf(alice.address)).to.be.equals(0);
        });

        it("Should fail if user has tokens but created v2 lock will release in less than 200 weeks", async function () {
            const amount = ethers.utils.parseEther("100");

            await hnd.mint(owner.address, amount);
            await hnd.mint(alice.address, amount);

            await hnd.approve(hundredBondV2.address, amount);
            await hundredBondV2.mint(alice.address, amount);

            const blockNumBefore = await ethers.provider.getBlockNumber();
            const blockBefore = await ethers.provider.getBlock(blockNumBefore);

            await hnd.connect(alice).approve(votingEscrowV1.address, amount);
            await votingEscrowV2.connect(alice).create_lock(amount, blockBefore.timestamp + 150 * WEEK);

            await expect(hundredBondV2.connect(alice).redeem())
                .to.be.revertedWith("HND lock needs to be extended");
        });

        it("Should create v2 lock if user has none", async function () {
            const amount = ethers.utils.parseEther("100");

            await hnd.mint(owner.address, amount);

            await hnd.approve(hundredBondV2.address, amount);
            await hundredBondV2.mint(alice.address, amount);

            await hundredBondV2.connect(alice).redeem();

            const locked = await votingEscrowV2.locked(alice.address);
            expect(locked.amount).to.be.equals(amount);
            expect(await hnd.balanceOf(hundredBondV2.address)).to.be.equals(0);
            expect(await hundredBondV2.balanceOf(alice.address)).to.be.equals(0);
        });

        it("Should succeed if user has tokens but created v2 lock will release in more than 200 weeks", async function () {
            const amount = ethers.utils.parseEther("100");

            await hnd.mint(owner.address, amount);
            await hnd.mint(alice.address, amount);

            await hnd.approve(hundredBondV1.address, amount);
            await hundredBondV2.mint(alice.address, amount);

            const blockNumBefore = await ethers.provider.getBlockNumber();
            const blockBefore = await ethers.provider.getBlock(blockNumBefore);

            await hnd.connect(alice).approve(votingEscrowV1.address, amount);
            await votingEscrowV2.connect(alice).create_lock(amount, blockBefore.timestamp + 204 * WEEK);

            await hundredBondV2.connect(alice).redeem();

            const locked = await votingEscrowV2.locked(alice.address);
            expect(locked.amount).to.be.equals(amount.mul(2));
            expect(await hnd.balanceOf(hundredBondV1.address)).to.be.equals(0);
            expect(await hundredBondV2.balanceOf(alice.address)).to.be.equals(0);
        });
    });

    describe("Rescue", function () {

        it("Should fail if block timestamp is before deploy time + 1 year", async function () {
            await expect(hundredBondV1.rescueHnd()).to.be.revertedWith("Cannot rescue before 1 year");
       });

        it("Should succeed if block timestamp is after deploy time + 1 year", async function () {
            const amount = ethers.utils.parseEther("100");

            await ethers.provider.send('evm_increaseTime', [52 * WEEK]);

            await hnd.mint(owner.address, amount);
            await hnd.approve(hundredBondV1.address, amount);
            await hundredBondV1.mint(alice.address, amount);

            await hundredBondV1.rescueHnd();

            expect(await hnd.balanceOf(owner.address)).to.be.equals(amount);
            expect(await hnd.balanceOf(hundredBondV1.address)).to.be.equals(0);
        });

    });

});