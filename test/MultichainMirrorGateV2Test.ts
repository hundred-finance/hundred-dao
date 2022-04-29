import { expect } from "chai";
import { ethers } from 'hardhat';
import {
    MirroredVotingEscrow__factory,
    VotingEscrowV2,
    VotingEscrowV2__factory,
    MirroredVotingEscrow,
    ERC20TOKEN,
    ERC20TOKEN__factory,
    MultichainEndpointMock__factory,
    MultichainEndpointMock,
    MultiChainMirrorGateV2,
    MultiChainMirrorGateV2__factory
} from "../typechain";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

const A_YEAR_FROM_NOW = 1668902400

describe("MultichainMirrorGateV2 contract", function () {

    let hndFactory: ERC20TOKEN__factory;
    let votingEscrowFactory: VotingEscrowV2__factory;
    let mirroredEscrowFactory: MirroredVotingEscrow__factory;
    let multichainEndpointFactory: MultichainEndpointMock__factory;
    let mirrorGateFactory: MultiChainMirrorGateV2__factory;

    let hnd: ERC20TOKEN
    let votingEscrow: VotingEscrowV2;
    let mirroredVotingEscrow: MirroredVotingEscrow;
    let multichainEndpoint: MultichainEndpointMock;
    let sourceMirrorGate: MultiChainMirrorGateV2;

    let targetVotingEscrow: VotingEscrowV2;
    let targetMirroredVotingEscrow: MirroredVotingEscrow;
    let targetMirrorGate: MultiChainMirrorGateV2;

    let owner: SignerWithAddress;
    let alice: SignerWithAddress;

    beforeEach(async function () {
        [owner, alice] =
            await ethers.getSigners();

        hndFactory = <ERC20TOKEN__factory>await ethers.getContractFactory("ERC20TOKEN");
        votingEscrowFactory = <VotingEscrowV2__factory>await ethers.getContractFactory("VotingEscrowV2");
        mirroredEscrowFactory = <MirroredVotingEscrow__factory>await ethers.getContractFactory("MirroredVotingEscrow")
        mirrorGateFactory = <MultiChainMirrorGateV2__factory>await ethers.getContractFactory("MultiChainMirrorGateV2");
        multichainEndpointFactory = <MultichainEndpointMock__factory>await ethers.getContractFactory("MultichainEndpointMock")

        hnd = await hndFactory.deploy("HND", "HND", 18, 0);
        votingEscrow = await votingEscrowFactory.deploy(
            hnd.address, "veHND", "veHND", "1.0", owner.address,
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000"
        );
        targetVotingEscrow = await votingEscrowFactory.deploy(
            hnd.address, "veHND", "veHND", "1.0", owner.address,
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000"
        );
        mirroredVotingEscrow = await mirroredEscrowFactory.deploy(
            owner.address, votingEscrow.address, "mveHND", "mveHND", "1.0"
        );
        targetMirroredVotingEscrow = await mirroredEscrowFactory.deploy(
            owner.address, targetVotingEscrow.address, "mveHND", "mveHND", "1.0"
        );

        multichainEndpoint = await multichainEndpointFactory.deploy();
        sourceMirrorGate = await mirrorGateFactory.deploy(multichainEndpoint.address, mirroredVotingEscrow.address, 1);
        targetMirrorGate = await mirrorGateFactory.deploy(multichainEndpoint.address, targetMirroredVotingEscrow.address, 25);

        await mirroredVotingEscrow.set_mirror_whitelist(sourceMirrorGate.address, true);
        await targetMirroredVotingEscrow.set_mirror_whitelist(targetMirrorGate.address, true);

        // enable owner to create multiple locks for testing
        await mirroredVotingEscrow.set_mirror_whitelist(owner.address, true);

        await hnd.mint(alice.address, ethers.utils.parseEther("100"));
        await votingEscrow.connect(alice).create_lock(ethers.utils.parseEther("100"), A_YEAR_FROM_NOW);
    });

    describe("Administrating contract", function () {

        it("Non admin should not be able to call pause", async function () {
            await expect(sourceMirrorGate.connect(alice).pause())
                .to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Non admin should not be able to call unpause", async function () {
            await expect(sourceMirrorGate.connect(alice).unPause())
                .to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Admin can call pause and unpause on contract", async function () {
            await sourceMirrorGate.connect(owner).pause();
            expect(await sourceMirrorGate.paused()).to.be.equals(true);

            await sourceMirrorGate.connect(owner).unPause();
            expect(await sourceMirrorGate.paused()).to.be.equals(false);
        });

    });

    describe("Mirroring", function () {

        it("Should fail if not enough fee is included", async function () {
            let lock = await votingEscrow.locked(alice.address);

            await expect(sourceMirrorGate.connect(alice)
                .mirrorLocks(25, targetMirrorGate.address, [1], [0], [lock.amount], [lock.end]))
                .to.be.revertedWith("Incorrect fee amount");
        });

        it("Should fail for non existing locks", async function () {
            let fee = await sourceMirrorGate.calculateFee(owner.address, 25, [2], [1], [1000], [1111]);

            await expect(sourceMirrorGate.mirrorLocks(
                25, targetMirrorGate.address, [2], [1], [1000], [1111],
                {value: fee}
            )).to.be.revertedWith("Incorrect lock amount");
        });

        it("Should succeed for user valid locks", async function () {
            let originalLock = await votingEscrow.locked(alice.address);
            await mirroredVotingEscrow.mirror_lock(alice.address, 10, 0, originalLock.amount.add(10), originalLock.end);

            let fee = await sourceMirrorGate.calculateFee(alice.address, 25, [1,10], [0,0], [originalLock.amount, originalLock.amount.add(10)], [originalLock.end, originalLock.end]);

            await sourceMirrorGate.connect(alice).mirrorLocks(
                25, targetMirrorGate.address, [1,10], [0,0], [originalLock.amount, originalLock.amount.add(10)], [originalLock.end, originalLock.end],
                {value: fee}
            );

            let mirroredLock1 = await targetMirroredVotingEscrow.mirrored_locks(alice.address, 1, 0);
            let mirroredLock2 = await targetMirroredVotingEscrow.mirrored_locks(alice.address, 10, 0);

            expect(mirroredLock1.amount).to.be.equals(originalLock.amount);
            expect(mirroredLock1.end).to.be.equals(originalLock.end);

            expect(mirroredLock2.amount).to.be.equals(originalLock.amount.add(10));
            expect(mirroredLock2.end).to.be.equals(originalLock.end);
        });

    });

});