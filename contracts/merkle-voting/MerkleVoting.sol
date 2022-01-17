// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Pausable } from "@openzeppelin/contracts/security/Pausable.sol";
import { MerkleProof } from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract MerkleVoting is Ownable, Pausable {

    bytes32 public immutable merkleRoot;

    mapping(address => bool) public hasVoted;

    uint256 public forVotes;
    uint256 public againstVotes;

    constructor(bytes32 _merkleRoot) {
        merkleRoot = _merkleRoot;
    }

    event Voted(address indexed to, uint256 weight, bool against);

    function voteFor(address to, uint256 weight, bytes32[] calldata proof) external whenNotPaused {
        _vote(to, weight, true, proof);
    }

    function voteAgainst(address to, uint256 weight, bytes32[] calldata proof) external whenNotPaused {
        _vote(to, weight, false, proof);
    }

    function pause() external onlyOwner whenNotPaused {
        _pause();
    }

    function unPause() external onlyOwner whenPaused {
        _unpause();
    }

    function _vote(address to, uint256 weight, bool vote, bytes32[] calldata proof) internal whenNotPaused {
        require(hasVoted[to] == false, "Already Voted");

        bytes32 leaf = keccak256(abi.encodePacked(to, weight));
        bool isValidLeaf = MerkleProof.verify(proof, merkleRoot, leaf);
        require(isValidLeaf == true, "Not Valid Merkle proof");

        hasVoted[to] = true;

        if (vote) {
            forVotes += weight;
        } else {
            againstVotes += weight;
        }

        emit Voted(to, weight, vote);
    }
}