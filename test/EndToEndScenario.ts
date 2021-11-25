import { expect } from "chai";
import { ethers } from 'hardhat';
const hre = require("hardhat");

import {
    VotingEscrow__factory,
    GaugeController__factory,
    VotingEscrow,
    GaugeController,
    Minter__factory,
    Minter,
    RewardPolicyMaker__factory,
    RewardPolicyMaker,
    Treasury__factory,
    Treasury,
    LiquidityGaugeV4__factory,
    LiquidityGaugeV4,
    ERC20TOKEN__factory,
    ERC20TOKEN
} from "../typechain";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {BigNumber} from "ethers";

describe("FeeConverter contract", function () {

    const DAY = 86400;
    const A_YEAR_FROM_NOW = 1668902400

    let erc20Factory: ERC20TOKEN__factory;

    let hnd: ERC20TOKEN;
    let hndLpToken: ERC20TOKEN;

    let treasuryFactory: Treasury__factory;
    let treasury: Treasury;

    let minterFactory: Minter__factory;
    let minter: Minter;

    let rewardPolicyMakerFactory: RewardPolicyMaker__factory;
    let rewardPolicyMaker: RewardPolicyMaker;

    let votingEscrowFactory: VotingEscrow__factory;
    let votingEscrow: VotingEscrow;

    let gaugeControllerFactory: GaugeController__factory;
    let gaugeController: GaugeController;

    let gaugeFactory: LiquidityGaugeV4__factory;

    let owner: SignerWithAddress;
    let alice: SignerWithAddress;
    let bob: SignerWithAddress;
    let eve: SignerWithAddress;

    beforeEach(async function () {

        [owner, alice, bob, eve] =
            await ethers.getSigners();

        erc20Factory = <ERC20TOKEN__factory>await ethers.getContractFactory("ERC20TOKEN");
        rewardPolicyMakerFactory = <RewardPolicyMaker__factory>await ethers.getContractFactory("RewardPolicyMaker");
        treasuryFactory = <Treasury__factory>await ethers.getContractFactory("Treasury");
        votingEscrowFactory = <VotingEscrow__factory>await ethers.getContractFactory("VotingEscrow");
        gaugeControllerFactory = <GaugeController__factory>await ethers.getContractFactory("GaugeController");
        minterFactory = <Minter__factory>await ethers.getContractFactory("Minter");
        gaugeFactory = <LiquidityGaugeV4__factory>await ethers.getContractFactory("LiquidityGaugeV4");

        hnd = await erc20Factory.deploy("Hundred Finance", "HND", 18, 0);
        hndLpToken = await erc20Factory.deploy("Hundred Finance Lp token", "hETH", 18, 0);

        rewardPolicyMaker = await rewardPolicyMakerFactory.deploy(DAY * 7);

        treasury = await treasuryFactory.deploy(hnd.address);
        votingEscrow = await votingEscrowFactory.deploy(hnd.address, "Voting locked HND", "veHND", "1.0");
        gaugeController = await gaugeControllerFactory.deploy(hnd.address, votingEscrow.address);
        minter = await minterFactory.deploy(treasury.address, gaugeController.address);

        await treasury.set_minter(minter.address);

        await hnd.mint(alice.address, ethers.utils.parseEther("10000"));
        await hnd.mint(bob.address, ethers.utils.parseEther("1000"));

        await hnd.mint(treasury.address, ethers.utils.parseEther("10000"));

        await hndLpToken.mint(alice.address, ethers.utils.parseEther("10"));
        await hndLpToken.mint(bob.address, ethers.utils.parseEther("10"));
        await hndLpToken.mint(eve.address, ethers.utils.parseEther("10"));

        await rewardPolicyMaker.set_rewards_at(3, ethers.utils.parseEther("100"));

    });

    describe("Locked voting amount", function () {
        it("Should reflect on the amount of claimable HND per gauge when users vote on gauge weights", async function () {

            let gauge1 = await gaugeFactory.deploy(hndLpToken.address, minter.address, owner.address, rewardPolicyMaker.address);
            let gauge2 = await gaugeFactory.deploy(hndLpToken.address, minter.address, owner.address, rewardPolicyMaker.address);

            await gaugeController["add_type(string,uint256)"]("Liquidity", ethers.utils.parseEther("10"));
            await gaugeController["add_gauge(address,int128,uint256)"](gauge1.address, 0, 1);
            await gaugeController["add_gauge(address,int128,uint256)"](gauge2.address, 0, 1);
            await hnd.connect(alice).approve(votingEscrow.address, ethers.utils.parseEther("10000000"));
            await hnd.connect(bob).approve(votingEscrow.address, ethers.utils.parseEther("10000000"));

            await votingEscrow.connect(alice).create_lock(ethers.utils.parseEther("10000"), A_YEAR_FROM_NOW);
            await votingEscrow.connect(bob).create_lock(ethers.utils.parseEther("1000"), A_YEAR_FROM_NOW);

            await gaugeController.connect(alice).vote_for_gauge_weights(gauge1.address, 1000);
            await gaugeController.connect(bob).vote_for_gauge_weights(gauge2.address, 1000);

            await hndLpToken.connect(alice).approve(gauge1.address, ethers.utils.parseEther("10000000"));
            await hndLpToken.connect(bob).approve(gauge2.address, ethers.utils.parseEther("10000000"));

            await gauge1.connect(alice)["deposit(uint256)"](ethers.utils.parseEther("10"));
            await gauge2.connect(bob)["deposit(uint256)"](ethers.utils.parseEther("10"));

            await ethers.provider.send("evm_increaseTime", [DAY * 30]);
            await ethers.provider.send("evm_mine", []);

            await minter.connect(alice).mint(gauge1.address);
            await minter.connect(bob).mint(gauge2.address);

            expect(await hnd.balanceOf(alice.address)).equals(ethers.utils.parseEther("90.909090909091762508"));
            expect(await hnd.balanceOf(bob.address)).equals(ethers.utils.parseEther("9.090909090908029388"));
        });

        it("Should boost user claimable HND within same gauge", async function () {

            let gauge = await gaugeFactory.deploy(hndLpToken.address, minter.address, owner.address, rewardPolicyMaker.address);

            await gaugeController["add_type(string,uint256)"]("Liquidity", ethers.utils.parseEther("10"));
            await gaugeController["add_gauge(address,int128,uint256)"](gauge.address, 0, 1);

            await hnd.connect(alice).approve(votingEscrow.address, ethers.utils.parseEther("10000000"));

            await votingEscrow.connect(alice).create_lock(ethers.utils.parseEther("10000"), A_YEAR_FROM_NOW);

            await hndLpToken.connect(alice).approve(gauge.address, ethers.utils.parseEther("10000000"));
            await hndLpToken.connect(eve).approve(gauge.address, ethers.utils.parseEther("10000000"));

            await gauge.connect(alice)["deposit(uint256)"](ethers.utils.parseEther("10"));
            await gauge.connect(eve)["deposit(uint256)"](ethers.utils.parseEther("10"));

            await ethers.provider.send("evm_increaseTime", [DAY * 30]);
            await ethers.provider.send("evm_mine", []);

            await minter.connect(alice).mint(gauge.address);
            await minter.connect(eve).mint(gauge.address);

            expect(await hnd.balanceOf(alice.address)).equals(ethers.utils.parseEther("71.428571428571280000"));
            expect(await hnd.balanceOf(eve.address)).equals(ethers.utils.parseEther("28.571428571428512000"));
        });

        it("gauge vote change should reflect on next epoch", async function () {
            let gauge1 = await gaugeFactory.deploy(hndLpToken.address, minter.address, owner.address, rewardPolicyMaker.address);
            let gauge2 = await gaugeFactory.deploy(hndLpToken.address, minter.address, owner.address, rewardPolicyMaker.address);

            await gaugeController["add_type(string,uint256)"]("Liquidity", ethers.utils.parseEther("10"));
            await gaugeController["add_gauge(address,int128,uint256)"](gauge1.address, 0, 1);
            await gaugeController["add_gauge(address,int128,uint256)"](gauge2.address, 0, 1);

            await hnd.connect(alice).approve(votingEscrow.address, ethers.utils.parseEther("10000000"));
            await hnd.connect(bob).approve(votingEscrow.address, ethers.utils.parseEther("10000000"));

            await votingEscrow.connect(alice).create_lock(ethers.utils.parseEther("10000"), A_YEAR_FROM_NOW);
            await votingEscrow.connect(bob).create_lock(ethers.utils.parseEther("1000"), A_YEAR_FROM_NOW);

            await gaugeController.connect(alice).vote_for_gauge_weights(gauge1.address, 1000);
            await gaugeController.connect(bob).vote_for_gauge_weights(gauge2.address, 1000);

            await hndLpToken.connect(alice).approve(gauge1.address, ethers.utils.parseEther("10000000"));
            await hndLpToken.connect(bob).approve(gauge2.address, ethers.utils.parseEther("10000000"));

            await gauge1.connect(alice)["deposit(uint256)"](ethers.utils.parseEther("10"));
            await gauge2.connect(bob)["deposit(uint256)"](ethers.utils.parseEther("10"));

            await rewardPolicyMaker.set_rewards_at(4, ethers.utils.parseEther("100"));
            await rewardPolicyMaker.set_rewards_at(6, ethers.utils.parseEther("100"));

            await ethers.provider.send("evm_increaseTime", [DAY * 7 * 3]);
            await ethers.provider.send("evm_mine", []);

            await minter.connect(alice).mint(gauge1.address);
            await minter.connect(bob).mint(gauge2.address);

            expect(await rewardPolicyMaker.current_epoch()).equals(BigNumber.from(4));
            expect(await hnd.balanceOf(alice.address)).equals(ethers.utils.parseEther("167.892316017317593420"));
            expect(await hnd.balanceOf(bob.address)).equals(ethers.utils.parseEther("16.789246632994672562"));

            await hnd.connect(alice).transfer(owner.address, ethers.utils.parseEther("167.892316017317593420"));
            await hnd.connect(bob).transfer(owner.address, ethers.utils.parseEther("16.789246632994672562"));

            await gaugeController.connect(alice).vote_for_gauge_weights(gauge1.address, 0);

            await ethers.provider.send("evm_increaseTime", [DAY * 3]);
            await ethers.provider.send("evm_mine", []);

            await minter.connect(alice).mint(gauge1.address);
            await minter.connect(bob).mint(gauge2.address);

            expect(await rewardPolicyMaker.current_epoch()).equals(BigNumber.from(5));
            expect(await hnd.balanceOf(alice.address)).equals(ethers.utils.parseEther("13.925865800865931587"));
            expect(await hnd.balanceOf(bob.address)).equals(ethers.utils.parseEther("1.392571548821386210"));

            await hnd.connect(alice).transfer(owner.address, ethers.utils.parseEther("13.925865800865931587"));
            await hnd.connect(bob).transfer(owner.address, ethers.utils.parseEther("1.392571548821386210"));

            await ethers.provider.send("evm_increaseTime", [DAY * 14]);
            await ethers.provider.send("evm_mine", []);

            await minter.connect(alice).mint(gauge1.address);
            await minter.connect(bob).mint(gauge2.address);

            expect(await rewardPolicyMaker.current_epoch()).equals(BigNumber.from(7));
            expect(await hnd.balanceOf(alice.address)).equals(ethers.utils.parseEther("0"));
            expect(await hnd.balanceOf(bob.address)).equals(ethers.utils.parseEther("99.999999999999791896"));

        });

    });

});