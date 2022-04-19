import { expect } from "chai";
import { ethers } from 'hardhat';
import {
    MirroredVotingEscrow__factory,
    VotingEscrowV2,
    VotingEscrowV2__factory,
    MirroredVotingEscrow,
    ERC20TOKEN,
    ERC20TOKEN__factory,
    MirrorGate__factory,
    MirrorGate,
    LayerZeroEndpointMock__factory,
    LayerZeroEndpointMock
} from "../typechain";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

const A_YEAR_FROM_NOW = 1668902400

describe("MirrorGate contract", function () {

    let hndFactory: ERC20TOKEN__factory;
    let votingEscrowFactory: VotingEscrowV2__factory;
    let mirroredEscrowFactory: MirroredVotingEscrow__factory;
    let layerZeroEndpointFactory: LayerZeroEndpointMock__factory;
    let mirrorGateFactory: MirrorGate__factory;

    let hnd: ERC20TOKEN
    let votingEscrow: VotingEscrowV2;
    let mirroredVotingEscrow: MirroredVotingEscrow;
    let layerZeroEndpoint: LayerZeroEndpointMock;
    let sourceMirrorGate: MirrorGate;

    let targetVotingEscrow: VotingEscrowV2;
    let targetMirroredVotingEscrow: MirroredVotingEscrow;
    let targetMirrorGate: MirrorGate;

    let owner: SignerWithAddress;
    let alice: SignerWithAddress;

    beforeEach(async function () {
        [owner, alice] =
            await ethers.getSigners();

        hndFactory = <ERC20TOKEN__factory>await ethers.getContractFactory("ERC20TOKEN");
        votingEscrowFactory = <VotingEscrowV2__factory>await ethers.getContractFactory("VotingEscrowV2");
        mirroredEscrowFactory = <MirroredVotingEscrow__factory>await ethers.getContractFactory("MirroredVotingEscrow")
        mirrorGateFactory = <MirrorGate__factory>await ethers.getContractFactory("MirrorGate");
        layerZeroEndpointFactory = <LayerZeroEndpointMock__factory>await ethers.getContractFactory("LayerZeroEndpointMock")

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
        layerZeroEndpoint = await layerZeroEndpointFactory.deploy(1);

        sourceMirrorGate = await mirrorGateFactory.deploy(layerZeroEndpoint.address, mirroredVotingEscrow.address, 1);
        targetMirrorGate = await mirrorGateFactory.deploy(layerZeroEndpoint.address, targetMirroredVotingEscrow.address, 25);

        await mirroredVotingEscrow.set_mirror_whitelist(sourceMirrorGate.address, true);
        await targetMirroredVotingEscrow.set_mirror_whitelist(targetMirrorGate.address, true);
    });

    describe("Administrating contract", function () {

        it("Non admin should not be able to call pause", async function () {
            expect(sourceMirrorGate.connect(alice).pause())
                .to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Non admin should not be able to call pause", async function () {
            expect(sourceMirrorGate.connect(alice).unPause())
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

        it("Should fail for non whitelisted chain", async function () {
            expect(sourceMirrorGate.mirrorLock(1, 0, 200000))
                .to.be.revertedWith("Unsupported target chain id");
        });

        it("Should fail for unsupported escrow id", async function () {

            await sourceMirrorGate.setMirrorGate(25, targetMirrorGate.address);

            expect(sourceMirrorGate.mirrorLock(25, 1, 200000))
                .to.be.revertedWith("Unsupported escrow id");
        });

        it("Should fail for user with no lock", async function () {

            await sourceMirrorGate.setMirrorGate(25, targetMirrorGate.address);

            expect(sourceMirrorGate.mirrorLock(25, 0, 200000))
                .to.be.revertedWith("User had no lock to mirror");
        });

        it("Should succeed for user valid lock", async function () {

            await sourceMirrorGate.setMirrorGate(25, targetMirrorGate.address);
            await targetMirrorGate.setMirrorGate(1, sourceMirrorGate.address);

            await hnd.mint(alice.address, ethers.utils.parseEther("100"));
            await votingEscrow.connect(alice).create_lock(ethers.utils.parseEther("100"), A_YEAR_FROM_NOW);

            await sourceMirrorGate.connect(alice).mirrorLock(25, 0, 200000);

            let originalLock = await votingEscrow.locked(alice.address);
            let mirroredLock = await targetMirroredVotingEscrow.mirrored_locks(alice.address, 1, 0);

            expect(mirroredLock.amount).to.be.equals(originalLock.amount);
            expect(mirroredLock.end).to.be.equals(originalLock.end);
        });

    });

});