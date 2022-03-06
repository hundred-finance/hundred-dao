import { ethers } from 'hardhat';
import {
    VotingEscrow,
} from "../../typechain";

import * as VotingEscrowArtifact from "../../artifacts/contracts/VotingEscrow.vy/VotingEscrow.json";

import * as fs from "fs";
import {Contract} from "ethers";
import {Deployment, getChainName, patchAbiGasFields} from "../airdrops/utils/helpers";
import path from "path";
import _ from 'lodash';

extractLocks()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

export async function extractLocks() {

    const [deployer] = await ethers.getSigners();
    const chainId = await deployer.getChainId();
    const chainName = getChainName(chainId);
    let deployments: Deployment|undefined = undefined;
    let storePath = path.join(__dirname, `data/users-with-locks.json`)
    let locksStorePath = path.join(__dirname, `data/locks.json`)

    try {
        deployments = JSON.parse(fs.readFileSync(path.join(__dirname, `../deployment/v1/${chainName}/deployments.json`)).toString());
    } catch (e) {
        console.log(`No v1 deployment on ${chainName}`)
    }

    if (!deployments) {
        try {
            deployments = JSON.parse(fs.readFileSync(path.join(__dirname, `../deployment/v2/${chainName}/deployments.json`)).toString());
        } catch (e) {
            console.log(`No v2 deployment on ${chainName}`)
        }
    }

    let votingEscrowAddress = deployments?.VotingEscrow
    if (!votingEscrowAddress) {
        votingEscrowAddress = deployments?.VotingEscrowV1
    }
    if (!votingEscrowAddress) {
        votingEscrowAddress = deployments?.VotingEscrowV2
    }

    if (deployments && votingEscrowAddress) {

        let votingEscrow: VotingEscrow =
            <VotingEscrow>new Contract(votingEscrowAddress, patchAbiGasFields(VotingEscrowArtifact.abi), deployer);

        let users: string[] = []
        try {
            users = JSON.parse(fs.readFileSync(storePath).toString());
        } catch (e) {}

        let locks: string[] = []
        try {
            locks = JSON.parse(fs.readFileSync(locksStorePath).toString());
        } catch (e) {}

        let chunks = _.chunk(users, 100)
        for (let i = 0; i < chunks.length; i++) {
            let newLocks: any[] = await Promise.all(chunks[i].map(user => votingEscrow.locked(user)))

            newLocks = newLocks.map((lock, index) => {
                return {
                    user: chunks[i][index],
                    amount: lock.amount.toString(),
                    end: lock.end.toString(),
                    chain_id: chainId,
                    escrow_id: 0
                }
            })

            locks = [...locks, ...newLocks.filter(l => l.amount.toString() !== "0")]
            console.log("added check", i)
            fs.writeFileSync(locksStorePath, JSON.stringify(locks, null, 4));
        }

    }
}