// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Pausable } from "@openzeppelin/contracts/security/Pausable.sol";
import { MerkleProof } from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

import "./ExternalMulticall.sol";

interface IMirroredVotingEscrow {
    function mirror_lock(
        address _to,
        uint256 _chain,
        uint256 _escrow_id,
        uint256 _value,
        uint256 _unlock_time
    ) external;
}

contract MerkleMirrorMultipleLocks is ExternalMulticall, Ownable, Pausable {

    uint256 chainId;

    IMirroredVotingEscrow mirroredVotingEscrow;

    MirrorEvent[] public mirrorEvents;

    constructor(uint256 _chainId, IMirroredVotingEscrow _mirroredVotingEscrow) {
        chainId = _chainId;
        mirroredVotingEscrow = _mirroredVotingEscrow;
    }

    struct MirrorEvent {
        bytes32 merkleRoot;
        mapping(address => mapping(uint256 => mapping(uint256 => bool))) hasMirrored;
    }

    event Mirrored(
        uint indexed eventId,
        address indexed to,
        uint256 chainId,
        uint256 escrowId,
        uint256 lockEnd,
        uint256 amount
    );

    event MirrorEventAdded(uint indexed id);

    function mirror_lock(
        address _to,
        uint256 _chainId,
        uint256 _escrowId,
        uint256 _lockeEnd,
        uint256 _amount,
        uint256 _eventId,
        bytes32[] calldata _proof
    ) external whenNotPaused {
        require(_eventId < mirrorEvents.length, "Invalid mirror event id");
        require(_chainId != chainId, "Cannot mirror local chain locks");

        MirrorEvent storage mirrorEvent_ = mirrorEvents[_eventId];

        require(mirrorEvent_.hasMirrored[_to][_chainId][_escrowId] == false, "Already Mirrored");

        bytes32 leaf_ = keccak256(abi.encodePacked(_to, _chainId, _escrowId, _lockeEnd, _amount));
        bool isValidLeaf_ = MerkleProof.verify(_proof, mirrorEvent_.merkleRoot, leaf_);
        require(isValidLeaf_ == true, "Invalid Merkle proof");

        mirrorEvent_.hasMirrored[_to][_chainId][_escrowId] = true;

        mirroredVotingEscrow.mirror_lock(_to, _chainId, _escrowId, _amount, _lockeEnd);

        emit Mirrored(_eventId, _to, _chainId, _escrowId, _lockeEnd, _amount);
    }

    function hasMirrored(
        uint _eventId,
        address _to,
        uint256 _chainId,
        uint256 _escrowId
    ) external view returns (bool) {
        return mirrorEvents[_eventId].hasMirrored[_to][_chainId][_escrowId];
    }

    function addMirrorEvent(bytes32 _merkleRoot) external onlyOwner {
        uint256 index_ = mirrorEvents.length;
        mirrorEvents.push();

        MirrorEvent storage newMirrorEvent_ = mirrorEvents[index_];
        newMirrorEvent_.merkleRoot = _merkleRoot;

        emit MirrorEventAdded(index_);
    }

    function pause() external onlyOwner whenNotPaused {
        _pause();
    }

    function unPause() external onlyOwner whenPaused {
        _unpause();
    }

}