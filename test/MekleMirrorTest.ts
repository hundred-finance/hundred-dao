import { expect } from "chai";
import { ethers } from 'hardhat';
import merkleTreeMirrorsGenerator from "../scripts/mirroring/merkleTreeMirrorsGenerator";

import {
    MerkleMirrorMultipleLocks__factory,
    MerkleMirrorMultipleLocks,
    MirroredVotingEscrow__factory,
    VotingEscrowV2,
    VotingEscrowV2__factory, MirroredVotingEscrow, ERC20TOKEN, ERC20TOKEN__factory
} from "../typechain";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {BigNumber} from "ethers";

describe("MerkleMirror contract", function () {

    let hndFactory: ERC20TOKEN__factory;
    let votingEscrowFactory: VotingEscrowV2__factory;
    let mirroredEscrowFactory: MirroredVotingEscrow__factory;
    let merkleMirrorFactory: MerkleMirrorMultipleLocks__factory;

    let hnd: ERC20TOKEN
    let votingEscrow: VotingEscrowV2;
    let mirroredVotingEscrow: MirroredVotingEscrow;
    let merkleMirror: MerkleMirrorMultipleLocks;

    let owner: SignerWithAddress;
    let alice: SignerWithAddress;
    let bob: SignerWithAddress;
    let eve: SignerWithAddress;

    let mirrors = [
        [
            "0xada2bd6a38d5aa0008221fc8f28eab5ef36cf7e5",
            "1666600000",
            "0",
            "1766620800",
            "1597033894659860689766"
        ]
    ];
    let merkleRoot: string;
    let hexProof: string[];

    beforeEach(async function () {
        [owner, alice, bob, eve] =
            await ethers.getSigners();

        let merkleTree = new merkleTreeMirrorsGenerator(mirrors);
        merkleRoot = await merkleTree.process();
        hexProof = merkleTree.generateProof(mirrors[0][0], mirrors[0].slice(1));

        hndFactory = <ERC20TOKEN__factory>await ethers.getContractFactory("ERC20TOKEN");
        votingEscrowFactory = <VotingEscrowV2__factory>await ethers.getContractFactory("VotingEscrowV2");
        mirroredEscrowFactory = <MirroredVotingEscrow__factory>await ethers.getContractFactory("MirroredVotingEscrow")
        merkleMirrorFactory = <MerkleMirrorMultipleLocks__factory>await ethers.getContractFactory("MerkleMirrorMultipleLocks");

        hnd = await hndFactory.deploy("HND", "HND", 18, 0);
        votingEscrow = await votingEscrowFactory.deploy(
            hnd.address, "veHND", "veHND", "1.0", owner.address,
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000"
        );
        mirroredVotingEscrow = await mirroredEscrowFactory.deploy(
            owner.address, votingEscrow.address, "mveHND", "mveHND", "1.0"
        );
        merkleMirror = await merkleMirrorFactory.deploy(1, mirroredVotingEscrow.address);

        await mirroredVotingEscrow.set_mirror_whitelist(merkleMirror.address, true);

        await merkleMirror.addMirrorEvent(merkleRoot);
    });

    describe("Administrating contract", function () {

        it("Non admin should not be able to call pause", async function () {
            expect(merkleMirror.connect(alice).pause())
                .to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Non admin should not be able to call pause", async function () {
            expect(merkleMirror.connect(alice).unPause())
                .to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Admin can call pause and unpause on contract", async function () {
            await merkleMirror.connect(owner).pause();
            expect(await merkleMirror.paused()).to.be.equals(true);

            await merkleMirror.connect(owner).unPause();
            expect(await merkleMirror.paused()).to.be.equals(false);
        });

    });

    describe("Mirroring", function () {

        it("Should fail for eligible user trying to mirror local chain", async function () {
            expect(merkleMirror.mirror_lock(mirrors[0][0], 1, 1, 1, 1, 0, hexProof))
                .to.be.revertedWith("Cannot mirror local chain locks");
        });

        it("Should succeed for eligible user with valid proof", async function () {
            await merkleMirror.mirror_lock(
                mirrors[0][0], parseInt(mirrors[0][1]),
                parseInt(mirrors[0][2]), BigNumber.from(mirrors[0][3]),
                BigNumber.from(mirrors[0][4]), 0,
                hexProof
            );
            expect(await merkleMirror.hasMirrored(0, mirrors[0][0], parseInt(mirrors[0][1]), parseInt(mirrors[0][2]))).to.be.equals(true);

            let lock = await mirroredVotingEscrow.mirrored_locks(mirrors[0][0], parseInt(mirrors[0][1]), parseInt(mirrors[0][2]));
            expect(lock.end.toString()).to.equals(mirrors[0][3])
            expect(lock.amount.toString()).to.equals(mirrors[0][4])
        });

        it("Should fail for non eligible user with valid proof", async function () {
            expect(merkleMirror.mirror_lock(alice.address,
                parseInt(mirrors[0][1]),
                parseInt(mirrors[0][2]), BigNumber.from(mirrors[0][3]),
                BigNumber.from(mirrors[0][4]), 0,
                hexProof
                ))
                .to.be.revertedWith("Invalid Merkle proof");
        });

        it("Should fail for eligible user with invalid proof", async function () {
            expect(merkleMirror.mirror_lock(
                mirrors[0][0], parseInt(mirrors[0][1]),
                parseInt(mirrors[0][2]), BigNumber.from(mirrors[0][3]),
                BigNumber.from(mirrors[0][4]), 0,
                hexProof.slice(1)
            ))
                .to.be.revertedWith("Invalid Merkle proof");
        });

    });

});