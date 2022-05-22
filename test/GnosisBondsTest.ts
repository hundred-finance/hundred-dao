import { expect } from "chai";
import { ethers } from 'hardhat';
import {
    TestERC20,
    TestERC20__factory,
    VeGNO,
    VeGNO__factory
} from "../typechain";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

const YEAR = 365 * 24 * 3600;
const UNLOCK_START_TIME = Math.floor(new Date().getTime() / 100);

describe("Gnosis Bonds contracts", function () {

    let erc20Factory: TestERC20__factory;
    let veGNOFactory: VeGNO__factory;

    let gno: TestERC20;
    let xDAI: TestERC20;
    let veGNO: VeGNO;

    let owner: SignerWithAddress;
    let alice: SignerWithAddress;
    let bob: SignerWithAddress;
    let charlie: SignerWithAddress;

    beforeEach(async function () {
        [owner, alice, bob, charlie] =
            await ethers.getSigners();

        erc20Factory = <TestERC20__factory>await ethers.getContractFactory("TestERC20");
        veGNOFactory = <VeGNO__factory>await ethers.getContractFactory("veGNO");

        gno = await erc20Factory.deploy("Gnosis Token", "GNO");
        xDAI = await erc20Factory.deploy("Gnosis DAI", "xDAI");
        veGNO = await veGNOFactory.deploy(gno.address, UNLOCK_START_TIME)
    });

    describe("Administrating veGNO contract", function () {

        it("Non admin should not be able to call pause", async function () {
            await expect(veGNO.connect(alice).pause())
                .to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Non admin should not be able to call pause", async function () {
            await expect(veGNO.connect(alice).unPause())
                .to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Non admin should not be able to call mint", async function () {
            await expect(veGNO.connect(alice).mint(alice.address, ethers.utils.parseEther("1")))
                .to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Non admin should not be able to call sweep", async function () {
            await expect(veGNO.connect(alice).sweep())
                .to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Admin can call pause and unpause on contract", async function () {
            await veGNO.connect(owner).pause();
            expect(await veGNO.paused()).to.be.equals(true);

            await veGNO.connect(owner).unPause();
            expect(await veGNO.paused()).to.be.equals(false);
        });

    });

    describe("veGNO use", function () {

        beforeEach(async function() {
            await gno.mint(owner.address, ethers.utils.parseEther("100"));

            await gno.approve(veGNO.address, ethers.utils.parseEther("100"));
            await veGNO.mint(owner.address, ethers.utils.parseEther("100"));
        });

        it("should transfer all gno to owner when calling sweep", async function() {
            expect(await gno.balanceOf(owner.address)).to.be.equals(ethers.utils.parseEther("0"));
            expect(await gno.balanceOf(veGNO.address)).to.be.equals(ethers.utils.parseEther("100"));

            await veGNO.sweep();

            expect(await gno.balanceOf(veGNO.address)).to.be.equals(ethers.utils.parseEther("0"));
            expect(await gno.balanceOf(owner.address)).to.be.equals(ethers.utils.parseEther("100"));
        });

        it("should transfer all user gno to owner when calling burn", async function() {
            await veGNO.transfer(alice.address, ethers.utils.parseEther("100"));
            expect(await veGNO.balanceOf(owner.address)).to.be.equals(ethers.utils.parseEther("0"));
            expect(await gno.balanceOf(owner.address)).to.be.equals(ethers.utils.parseEther("0"));

            await veGNO.connect(alice).burn();

            expect(await veGNO.balanceOf(alice.address)).to.be.equals(ethers.utils.parseEther("0"));
            expect(await gno.balanceOf(owner.address)).to.be.equals(ethers.utils.parseEther("100"));
        });

        it("should fail when redeem is called before unlock half time ", async function() {
            await expect(veGNO.connect(alice).redeem())
                .to.be.revertedWith("Nothing to redeem")
        });

        it("should fail when when mint is called with an amount greater than Owner balance of GNO", async function() {
            await gno.mint(owner.address, ethers.utils.parseEther("100"));

            await expect(veGNO.mint(alice.address, ethers.utils.parseEther("1000")))
                .to.be.revertedWith("ERC20: transfer amount exceeds balance")
        });

        it("should unlock half amount of GNO when redeem is called at half time", async function() {
            await veGNO.transfer(alice.address, ethers.utils.parseEther("100"));
            await ethers.provider.send('evm_setNextBlockTimestamp', [UNLOCK_START_TIME + YEAR / 2]);
            await ethers.provider.send('evm_mine', []);

            await veGNO.connect(alice).redeem();

            let unRedeemedBalance = parseFloat((await veGNO.balanceOf(alice.address)).toString()) / 1e18
            let redeemedBalance = parseFloat((await gno.balanceOf(alice.address)).toString()) / 1e18

            expect(unRedeemedBalance).approximately(50, 1e-5);
            expect(redeemedBalance).approximately(50, 1e-5);
        });

        it("should unlock 75% amount of GNO when redeem is called after 9 months", async function() {
            await veGNO.transfer(alice.address, ethers.utils.parseEther("100"));
            await ethers.provider.send('evm_setNextBlockTimestamp', [UNLOCK_START_TIME + YEAR * 3 / 4]);
            await ethers.provider.send('evm_mine', []);

            await veGNO.connect(alice).redeem();

            let unRedeemedBalance = parseFloat((await veGNO.balanceOf(alice.address)).toString()) / 1e18
            let redeemedBalance = parseFloat((await gno.balanceOf(alice.address)).toString()) / 1e18

            expect(unRedeemedBalance).approximately(25, 1e-5);
            expect(redeemedBalance).approximately(75, 1e-5);
        });

        it("should unlock 100% amount of GNO when redeem is called after 1 year", async function() {
            await veGNO.transfer(alice.address, ethers.utils.parseEther("100"));
            await ethers.provider.send('evm_setNextBlockTimestamp', [UNLOCK_START_TIME + YEAR]);
            await ethers.provider.send('evm_mine', []);

            await veGNO.connect(alice).redeem();

            expect(await veGNO.balanceOf(alice.address)).to.be.equals(ethers.utils.parseEther("0"));
            expect(await gno.balanceOf(alice.address)).to.be.equals(ethers.utils.parseEther("100"));
        });

        it("should progressively get full GNO amount even after redeem several times during the year", async function() {
            let unlockStartTime2 = UNLOCK_START_TIME + YEAR;
            let veGNO2 = await veGNOFactory.deploy(gno.address, unlockStartTime2);
            await gno.mint(owner.address, ethers.utils.parseEther("100"));

            await gno.approve(veGNO2.address, ethers.utils.parseEther("100"));
            await veGNO2.mint(owner.address, ethers.utils.parseEther("100"));
            await veGNO2.transfer(bob.address, ethers.utils.parseEther("100"));

            await ethers.provider.send('evm_setNextBlockTimestamp', [unlockStartTime2 + YEAR / 2]);
            await ethers.provider.send('evm_mine', []);

            await veGNO2.connect(bob).redeem();

            let unRedeemedBalance = parseFloat((await veGNO2.balanceOf(bob.address)).toString()) / 1e18
            let redeemedBalance = parseFloat((await gno.balanceOf(bob.address)).toString()) / 1e18

            expect(unRedeemedBalance).approximately(50, 1e-5);
            expect(redeemedBalance).approximately(50, 1e-5);

            await ethers.provider.send('evm_setNextBlockTimestamp', [unlockStartTime2 + YEAR / 2 + YEAR / 4]);
            await ethers.provider.send('evm_mine', []);

            await veGNO2.connect(bob).redeem();

            unRedeemedBalance = parseFloat((await veGNO2.balanceOf(bob.address)).toString()) / 1e18
            redeemedBalance = parseFloat((await gno.balanceOf(bob.address)).toString()) / 1e18

            expect(unRedeemedBalance).approximately(25, 1e-5);
            expect(redeemedBalance).approximately(75, 1e-5);

            await ethers.provider.send('evm_setNextBlockTimestamp', [unlockStartTime2 + YEAR]);
            await ethers.provider.send('evm_mine', []);

            await veGNO2.connect(bob).redeem();

            expect(await veGNO2.balanceOf(bob.address)).to.be.equals(ethers.utils.parseEther("0"));
            expect(await gno.balanceOf(bob.address)).to.be.equals(ethers.utils.parseEther("100"));
        });

        it("should release tokens according to schedule and track cumulated burned balances", async function() {
            let unlockStartTime2 = UNLOCK_START_TIME + 2 * YEAR;
            let veGNO2 = await veGNOFactory.deploy(gno.address, unlockStartTime2);
            await gno.mint(owner.address, ethers.utils.parseEther("100"));

            await gno.approve(veGNO2.address, ethers.utils.parseEther("100"));
            await veGNO2.mint(owner.address, ethers.utils.parseEther("100"));
            await veGNO2.transfer(bob.address, ethers.utils.parseEther("100"));

            await ethers.provider.send('evm_setNextBlockTimestamp', [unlockStartTime2 + YEAR / 2]);
            await ethers.provider.send('evm_mine', []);

            await veGNO2.connect(bob).redeem();

            let unRedeemedBalance = parseFloat((await veGNO2.balanceOf(bob.address)).toString()) / 1e18
            let redeemedBalance = parseFloat((await gno.balanceOf(bob.address)).toString()) / 1e18

            expect(unRedeemedBalance).approximately(50, 1e-5);
            expect(redeemedBalance).approximately(50, 1e-5);

            await ethers.provider.send('evm_setNextBlockTimestamp', [unlockStartTime2 + YEAR / 2 + 100]);
            await ethers.provider.send('evm_mine', []);

            await veGNO2.connect(bob).redeem();

            unRedeemedBalance = parseFloat((await veGNO2.balanceOf(bob.address)).toString()) / 1e18
            redeemedBalance = parseFloat((await gno.balanceOf(bob.address)).toString()) / 1e18

            expect(unRedeemedBalance).approximately(49.99967, 1e-5);
            expect(redeemedBalance).approximately(50.00032, 1e-5);

            await ethers.provider.send('evm_setNextBlockTimestamp', [unlockStartTime2 + YEAR / 2 + 200]);
            await ethers.provider.send('evm_mine', []);

            await veGNO2.connect(bob).redeem();

            unRedeemedBalance = parseFloat((await veGNO2.balanceOf(bob.address)).toString()) / 1e18
            redeemedBalance = parseFloat((await gno.balanceOf(bob.address)).toString()) / 1e18

            expect(unRedeemedBalance).approximately(49.99936, 1e-5);
            expect(redeemedBalance).approximately(50.00063, 1e-5);
        });

        it("moving small amounts of veGNO between wallets should not give big redeem advantage", async function() {
            let unlockStartTime = UNLOCK_START_TIME + 3 * YEAR;
            let veGNO2 = await veGNOFactory.deploy(gno.address, unlockStartTime);
            await gno.mint(owner.address, 30);

            await gno.approve(veGNO2.address, 30);
            await veGNO2.mint(owner.address, 30);
            await veGNO2.transfer(alice.address, 15);
            await veGNO2.transfer(charlie.address, 15);

            await ethers.provider.send('evm_setNextBlockTimestamp', [unlockStartTime + YEAR / 2]);
            await ethers.provider.send('evm_mine', []);

            await veGNO2.connect(alice).redeem();
            await veGNO2.connect(charlie).redeem();
            expect((await veGNO2.balanceOf(alice.address)).toNumber()).to.be.equals(8);
            expect((await veGNO2.balanceOf(charlie.address)).toNumber()).to.be.equals(8);
            expect((await veGNO2.burnedBalances(charlie.address)).toNumber()).to.be.equals(7);

            await veGNO2.connect(alice).transfer(bob.address, 1);
            expect((await veGNO2.balanceOf(alice.address)).toNumber()).to.be.equals(7);
            expect((await veGNO2.balanceOf(bob.address)).toNumber()).to.be.equals(1);
            expect((await veGNO2.burnedBalances(bob.address)).toNumber()).to.be.equals(0);


            await expect(veGNO2.connect(alice).redeem()).to.be.revertedWith("Nothing to redeem");
            await expect(veGNO2.connect(bob).redeem()).to.be.revertedWith("Nothing to redeem");
            await expect(veGNO2.connect(charlie).redeem()).to.be.revertedWith("Nothing to redeem");

            await ethers.provider.send('evm_setNextBlockTimestamp', [unlockStartTime + YEAR / 2 + YEAR / 4]);
            await ethers.provider.send('evm_mine', []);

            await veGNO2.connect(alice).redeem();
            await veGNO2.connect(charlie).redeem();
            await expect(veGNO2.connect(bob).redeem()).to.be.revertedWith("Nothing to redeem");
            expect((await veGNO2.balanceOf(alice.address)).toNumber()).to.be.equals(4);
            expect((await veGNO2.balanceOf(charlie.address)).toNumber()).to.be.equals(5);

            await veGNO2.connect(alice).transfer(bob.address, 1);
            expect((await veGNO2.balanceOf(alice.address)).toNumber()).to.be.equals(3);
            expect((await veGNO2.balanceOf(bob.address)).toNumber()).to.be.equals(2);

            await veGNO2.connect(bob).redeem();
            expect((await veGNO2.balanceOf(bob.address)).toNumber()).to.be.equals(1);

            await veGNO2.connect(bob).transfer(alice.address, 1);
            await gno.connect(bob).transfer(alice.address, 1);
            // alice with 2 transfers of 1 wei veGNO
            // is able to mint 1 wei GNO before schedule
            // alice total redeem is 11
            expect((await veGNO2.balanceOf(alice.address)).toNumber()).to.be.equals(4);
            expect((await gno.balanceOf(alice.address)).toNumber()).to.be.equals(11);
            // charlie, redeems as time goes on, he is able to redeem 10
            // in theory, at 3/4 year from schedule start, user is eligible for 15 * 3 / 4 = 11
            // so it means normal users are getting less than the theoretical,
            // and trying to play the system can help in this case getting closer
            // to the theoretical value
            expect((await veGNO2.balanceOf(charlie.address)).toNumber()).to.be.equals(5);
            expect((await gno.balanceOf(charlie.address)).toNumber()).to.be.equals(10);
        });

    });
});