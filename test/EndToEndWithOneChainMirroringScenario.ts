import { expect } from "chai";
import { ethers } from 'hardhat';

import {
    VotingEscrowV2__factory,
    GaugeControllerV2__factory,
    VotingEscrowV2,
    MirroredVotingEscrow__factory,
    MirroredVotingEscrow,
    GaugeControllerV2,
    Minter__factory,
    Minter,
    RewardPolicyMaker__factory,
    RewardPolicyMaker,
    Treasury__factory,
    Treasury,
    LiquidityGaugeV41__factory,
    VotingEscrowDelegationV2__factory,
    DelegationProxy,
    ERC20TOKEN__factory,
    ERC20TOKEN, VotingEscrowDelegationV2, DelegationProxy__factory, SmartWalletChecker__factory, SmartWalletChecker
} from "../typechain";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {BigNumber} from "ethers";

describe("End to End with One Chain Mirroring", function () {

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

    let votingEscrowFactory: VotingEscrowV2__factory;
    let votingEscrow: VotingEscrowV2;

    let mirroredVotingEscrowFactory: MirroredVotingEscrow__factory;
    let mirroredVotingEscrow: MirroredVotingEscrow;

    let gaugeControllerFactory: GaugeControllerV2__factory;
    let gaugeController: GaugeControllerV2;

    let delegationProxyFactory: DelegationProxy__factory;
    let delegationProxy: DelegationProxy;

    let votingEscrowDelegationFactory: VotingEscrowDelegationV2__factory;
    let votingEscrowDelegation: VotingEscrowDelegationV2;

    let gaugeFactory: LiquidityGaugeV41__factory;

    let smartWalletFactory: SmartWalletChecker__factory;
    let smartWalletChecker: SmartWalletChecker;
    let lockCreator: SmartWalletChecker;

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
        votingEscrowFactory = <VotingEscrowV2__factory>await ethers.getContractFactory("VotingEscrowV2");
        mirroredVotingEscrowFactory = <MirroredVotingEscrow__factory>await ethers.getContractFactory("MirroredVotingEscrow");
        delegationProxyFactory = <DelegationProxy__factory>await ethers.getContractFactory("DelegationProxy");
        votingEscrowDelegationFactory = <VotingEscrowDelegationV2__factory>await ethers.getContractFactory("VotingEscrowDelegationV2");
        gaugeControllerFactory = <GaugeControllerV2__factory>await ethers.getContractFactory("GaugeControllerV2");
        minterFactory = <Minter__factory>await ethers.getContractFactory("Minter");
        gaugeFactory = <LiquidityGaugeV41__factory>await ethers.getContractFactory("LiquidityGaugeV4_1");
        smartWalletFactory = <SmartWalletChecker__factory>await ethers.getContractFactory("SmartWalletChecker");

        hnd = await erc20Factory.deploy("Hundred Finance", "HND", 18, 0);
        hndLpToken = await erc20Factory.deploy("Hundred Finance Lp token", "hETH", 18, 0);

        rewardPolicyMaker = await rewardPolicyMakerFactory.deploy(DAY * 7, owner.address);

        smartWalletChecker = await smartWalletFactory.deploy(owner.address);
        lockCreator = await smartWalletFactory.deploy(owner.address);
        treasury = await treasuryFactory.deploy(hnd.address, owner.address);
        votingEscrow = await votingEscrowFactory.deploy(hnd.address, "Voting locked HND", "veHND", "1.0", owner.address, smartWalletChecker.address, lockCreator.address);
        mirroredVotingEscrow = await mirroredVotingEscrowFactory.deploy(owner.address, votingEscrow.address, "Mirroed Voting locked HND", "mveHND", "1.0");
        gaugeController = await gaugeControllerFactory.deploy(mirroredVotingEscrow.address, owner.address);
        minter = await minterFactory.deploy(treasury.address, gaugeController.address);
        votingEscrowDelegation = await votingEscrowDelegationFactory.deploy("veBoost", "veBoost", "", mirroredVotingEscrow.address, owner.address);
        delegationProxy = await delegationProxyFactory.deploy(votingEscrowDelegation.address, owner.address, owner.address, mirroredVotingEscrow.address);

        await treasury.set_minter(minter.address);

        await hnd.mint(treasury.address, ethers.utils.parseEther("10000"));

        await hndLpToken.mint(alice.address, ethers.utils.parseEther("10"));
        await hndLpToken.mint(bob.address, ethers.utils.parseEther("10"));
        await hndLpToken.mint(eve.address, ethers.utils.parseEther("10"));

        await mirroredVotingEscrow.set_mirror_whitelist(owner.address, true);

        await rewardPolicyMaker.set_rewards_at(3, ethers.utils.parseEther("100"));

    });

    describe("Locked voting amount", function () {
        it("Should reflect on the amount of claimable HND per gauge when users vote on gauge weights", async function () {

            let gauge1 = await gaugeFactory.deploy(hndLpToken.address, minter.address, owner.address, rewardPolicyMaker.address, delegationProxy.address, 200);
            let gauge2 = await gaugeFactory.deploy(hndLpToken.address, minter.address, owner.address, rewardPolicyMaker.address, delegationProxy.address, 200);

            await gaugeController["add_type(string,uint256)"]("Liquidity", ethers.utils.parseEther("10"));
            await gaugeController["add_gauge(address,int128,uint256)"](gauge1.address, 0, 1);
            await gaugeController["add_gauge(address,int128,uint256)"](gauge2.address, 0, 1);

            await mirroredVotingEscrow.connect(owner).mirror_lock(alice.address, 250, 0, ethers.utils.parseEther("10000"), A_YEAR_FROM_NOW);
            await mirroredVotingEscrow.connect(owner).mirror_lock(bob.address, 250, 0, ethers.utils.parseEther("1000"), A_YEAR_FROM_NOW);

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

            let gauge = await gaugeFactory.deploy(hndLpToken.address, minter.address, owner.address, rewardPolicyMaker.address, delegationProxy.address, 200);

            await gaugeController["add_type(string,uint256)"]("Liquidity", ethers.utils.parseEther("10"));
            await gaugeController["add_gauge(address,int128,uint256)"](gauge.address, 0, 1);

            await mirroredVotingEscrow.connect(owner).mirror_lock(alice.address, 250, 0, ethers.utils.parseEther("10000"), A_YEAR_FROM_NOW);

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
            let gauge1 = await gaugeFactory.deploy(hndLpToken.address, minter.address, owner.address, rewardPolicyMaker.address, delegationProxy.address, 200);
            let gauge2 = await gaugeFactory.deploy(hndLpToken.address, minter.address, owner.address, rewardPolicyMaker.address, delegationProxy.address, 200);

            await gaugeController["add_type(string,uint256)"]("Liquidity", ethers.utils.parseEther("10"));
            await gaugeController["add_gauge(address,int128,uint256)"](gauge1.address, 0, 1);
            await gaugeController["add_gauge(address,int128,uint256)"](gauge2.address, 0, 1);

            await mirroredVotingEscrow.connect(owner).mirror_lock(alice.address, 250, 0, ethers.utils.parseEther("10000"), A_YEAR_FROM_NOW);
            await mirroredVotingEscrow.connect(owner).mirror_lock(bob.address, 250, 0, ethers.utils.parseEther("1000"), A_YEAR_FROM_NOW);

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

            let aliceBalance = await hnd.balanceOf(alice.address);
            let bobBalance = await hnd.balanceOf(bob.address);

            expect(parseFloat(aliceBalance.toString()) / parseFloat(bobBalance.toString())).approximately(10, 0.0001);

            await hnd.connect(alice).transfer(owner.address, aliceBalance);
            await hnd.connect(bob).transfer(owner.address, bobBalance);

            await gaugeController.connect(alice).vote_for_gauge_weights(gauge1.address, 0);

            await ethers.provider.send("evm_increaseTime", [DAY * 3]);
            await ethers.provider.send("evm_mine", []);

            await minter.connect(alice).mint(gauge1.address);
            await minter.connect(bob).mint(gauge2.address);

            expect(await rewardPolicyMaker.current_epoch()).equals(BigNumber.from(5));
            aliceBalance = await hnd.balanceOf(alice.address);
            bobBalance = await hnd.balanceOf(bob.address);

            expect(parseFloat(aliceBalance.toString()) / parseFloat(bobBalance.toString())).approximately(10, 0.001);

            await hnd.connect(alice).transfer(owner.address, aliceBalance);
            await hnd.connect(bob).transfer(owner.address, bobBalance);

            await ethers.provider.send("evm_increaseTime", [DAY * 14]);
            await ethers.provider.send("evm_mine", []);

            await minter.connect(alice).mint(gauge1.address);
            await minter.connect(bob).mint(gauge2.address);

            expect(await rewardPolicyMaker.current_epoch()).equals(BigNumber.from(7));
            aliceBalance = await hnd.balanceOf(alice.address);
            bobBalance = await hnd.balanceOf(bob.address);

            expect(aliceBalance).equals(ethers.utils.parseEther("0"));
            expect(parseFloat(bobBalance.toString()) / 1e18).approximately(100, 0.0000001);

        });

    });

});