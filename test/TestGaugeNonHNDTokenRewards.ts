import { expect } from "chai";
import { ethers } from 'hardhat';

import {
    VotingEscrowV2__factory,
    GaugeControllerV2__factory,
    VotingEscrowV2,
    GaugeControllerV2,
    LiquidityGaugeV5__factory,
    ERC20TOKEN__factory,
    ERC20TOKEN,
    RewardPolicyMakerV2__factory,
    TreasuryV2__factory,
    MirroredVotingEscrow__factory,
    DelegationProxy__factory,
    VotingEscrowDelegationV2__factory,
    MinterV2__factory,
    SmartWalletChecker__factory,
    TreasuryV2,
    MinterV2,
    RewardPolicyMakerV2,
    MirroredVotingEscrow, DelegationProxy, VotingEscrowDelegationV2, SmartWalletChecker
} from "../typechain";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

describe("Test Gauge Rewards", function () {

    const DAY = 86400;

    let erc20Factory: ERC20TOKEN__factory;

    let hnd: ERC20TOKEN;
    let hndLpToken: ERC20TOKEN;
    let rewardToken: ERC20TOKEN;

    let treasuryFactory: TreasuryV2__factory;
    let treasury: TreasuryV2;

    let minterFactory: MinterV2__factory;
    let minter: MinterV2;

    let rewardPolicyMakerFactory: RewardPolicyMakerV2__factory;
    let rewardPolicyMaker: RewardPolicyMakerV2;

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

    let smartWalletFactory: SmartWalletChecker__factory;
    let smartWalletChecker: SmartWalletChecker;
    let lockCreator: SmartWalletChecker;

    let gaugeFactory: LiquidityGaugeV5__factory;

    let owner: SignerWithAddress;
    let alice: SignerWithAddress;
    let bob: SignerWithAddress;
    let eve: SignerWithAddress;

    beforeEach(async function () {

        [owner, alice, bob, eve] =
            await ethers.getSigners();

        erc20Factory = <ERC20TOKEN__factory>await ethers.getContractFactory("ERC20TOKEN");
        rewardPolicyMakerFactory = <RewardPolicyMakerV2__factory>await ethers.getContractFactory("RewardPolicyMakerV2");
        treasuryFactory = <TreasuryV2__factory>await ethers.getContractFactory("TreasuryV2");
        votingEscrowFactory = <VotingEscrowV2__factory>await ethers.getContractFactory("VotingEscrowV2");
        mirroredVotingEscrowFactory = <MirroredVotingEscrow__factory>await ethers.getContractFactory("MirroredVotingEscrow");
        delegationProxyFactory = <DelegationProxy__factory>await ethers.getContractFactory("DelegationProxy");
        votingEscrowDelegationFactory = <VotingEscrowDelegationV2__factory>await ethers.getContractFactory("VotingEscrowDelegationV2");
        gaugeControllerFactory = <GaugeControllerV2__factory>await ethers.getContractFactory("GaugeControllerV2");
        minterFactory = <MinterV2__factory>await ethers.getContractFactory("MinterV2");
        gaugeFactory = <LiquidityGaugeV5__factory>await ethers.getContractFactory("LiquidityGaugeV5");
        smartWalletFactory = <SmartWalletChecker__factory>await ethers.getContractFactory("SmartWalletChecker");

        hnd = await erc20Factory.deploy("Hundred Finance", "HND", 18, 0);
        hndLpToken = await erc20Factory.deploy("Hundred Finance Lp token", "hETH", 18, 0);
        rewardToken = await erc20Factory.deploy("Reward token", "RRR", 18, 0);

        rewardPolicyMaker = await rewardPolicyMakerFactory.deploy(DAY * 7, owner.address);

        smartWalletChecker = await smartWalletFactory.deploy(owner.address);
        lockCreator = await smartWalletFactory.deploy(owner.address);
        treasury = await treasuryFactory.deploy(owner.address);
        votingEscrow = await votingEscrowFactory.deploy(hnd.address, "Voting locked HND", "veHND", "1.0", owner.address, smartWalletChecker.address, lockCreator.address);
        mirroredVotingEscrow = await mirroredVotingEscrowFactory.deploy(owner.address, votingEscrow.address, "Mirroed Voting locked HND", "mveHND", "1.0");
        gaugeController = await gaugeControllerFactory.deploy(mirroredVotingEscrow.address, owner.address);
        minter = await minterFactory.deploy(treasury.address, gaugeController.address);
        votingEscrowDelegation = await votingEscrowDelegationFactory.deploy("veBoost", "veBoost", "", mirroredVotingEscrow.address, owner.address);
        delegationProxy = await delegationProxyFactory.deploy(votingEscrowDelegation.address, owner.address, owner.address, mirroredVotingEscrow.address);

        await treasury.set_minter(minter.address);
        await minter.add_token(hnd.address);

        await hndLpToken.mint(alice.address, ethers.utils.parseEther("70"));
        await hndLpToken.mint(bob.address, ethers.utils.parseEther("30"));

        await rewardToken.mint(treasury.address, ethers.utils.parseEther("100"));
    });

    describe("Claiming rewards after 1 WEEK", function () {
        it("Should be split pro-rata users provider liquidity", async function () {

            let gauge1 = await gaugeFactory.deploy(
                hndLpToken.address, minter.address, owner.address,
                rewardPolicyMaker.address, delegationProxy.address
            );

            await minter.add_token(rewardToken.address);
            await rewardPolicyMaker.set_rewards_at(3, rewardToken.address, ethers.utils.parseEther("100"));

            await gaugeController["add_type(string,uint256)"]("Liquidity", ethers.utils.parseEther("10"));
            await gaugeController["add_gauge(address,int128,uint256)"](gauge1.address, 0, 1);

            await hndLpToken.connect(alice).approve(gauge1.address, ethers.utils.parseEther("10000000"));

            await gauge1.connect(alice)["deposit(uint256)"](ethers.utils.parseEther("70"));
            await gauge1.connect(bob)["deposit(uint256)"](ethers.utils.parseEther("30"));

            await ethers.provider.send("evm_increaseTime", [DAY * 30]);
            await ethers.provider.send("evm_mine", []);

            await minter.connect(alice).mint(gauge1.address);
            await minter.connect(bob).mint(gauge1.address);

            let aliceBalance = await rewardToken.balanceOf(alice.address);
            let bobBalance = await rewardToken.balanceOf(bob.address);
            let ownerBalance = await rewardToken.balanceOf(owner.address);

            expect(parseFloat(aliceBalance.toString()) / 1e18).approximately(70, 0.1);
            expect(parseFloat(bobBalance.toString()) / 1e18).approximately(30, 0.1);
        });
    });

});