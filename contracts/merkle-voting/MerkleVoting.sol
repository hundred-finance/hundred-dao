// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { MerkleProof } from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract MerkleVoting {

    bytes32 public immutable merkleRoot;

    mapping(address => bool) public hasVoted;

    uint public startTime;
    uint public endTime;

    uint256 public forVotes;
    uint256 public againstVotes;

    constructor(bytes32 _merkleRoot, uint _startTime, uint _endTime) {
        merkleRoot = _merkleRoot;
        startTime = _startTime;
        endTime = _endTime;
    }

    event Voted(address indexed to, uint256 weight, bool against);

    function voteFor(address _to, uint256 _weight, bytes32[] calldata _proof) external whenActive {
        _vote(_to, _weight, true, _proof);
    }

    function voteAgainst(address _to, uint256 _weight, bytes32[] calldata _proof) external whenActive {
        _vote(_to, _weight, false, _proof);
    }

    function _vote(address _to, uint256 _weight, bool _vote, bytes32[] calldata _proof) internal {
        require(hasVoted[_to] == false, "Already Voted");

        bytes32 leaf = keccak256(abi.encodePacked(_to, _weight));
        bool isValidLeaf = MerkleProof.verify(_proof, merkleRoot, leaf);
        require(isValidLeaf == true, "Not Valid Merkle proof");

        hasVoted[_to] = true;

        if (_vote) {
            forVotes += _weight;
        } else {
            againstVotes += _weight;
        }

        emit Voted(_to, _weight, _vote);
    }

    modifier whenActive() {
        require(block.timestamp > startTime, "Voting not started yet");
        require(block.timestamp < endTime, "Voting closed");
        _;
    }
}