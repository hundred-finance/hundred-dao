// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Pausable } from "@openzeppelin/contracts/security/Pausable.sol";

struct LockedBalance {
    int128 amount;
    uint256 end;
}

interface IVotingEscrow {
    function locked(address _user) external view returns(LockedBalance memory);
}

interface IMirroredVotingEscrow {
    function voting_escrow_count() external view returns(uint256);

    function voting_escrows(uint256 _index) external view returns(address);

    function mirror_lock(
        address _to,
        uint256 _chain,
        uint256 _escrow_id,
        uint256 _value,
        uint256 _unlock_time
    ) external;
}

interface ICallProxy {
    function anyCall(
        address _to,
        bytes calldata _data,
        address _fallback,
        uint256 _toChainID
    ) external;

    function withdraw(uint256 _amount) external;

    function executionBudget(address _account) external returns(uint256);
}

contract MultiChainMirrorGate is Ownable, Pausable {

    uint256 chainId;

    IMirroredVotingEscrow public mirrorEscrow;

    ICallProxy public endpoint;

    constructor(ICallProxy _endpoint, IMirroredVotingEscrow _mirrorEscrow, uint256 _chainId) {
        endpoint = _endpoint;
        mirrorEscrow = _mirrorEscrow;
        chainId = _chainId;
    }

    function mirrorLock(
        uint256 _toChainId,
        address _toMirrorEscrow,
        uint256 _escrowId
    ) external whenNotPaused {
        address user_ = _msgSender();

        require(_escrowId < mirrorEscrow.voting_escrow_count(), "Unsupported escrow id");

        LockedBalance memory lock = IVotingEscrow(mirrorEscrow.voting_escrows(_escrowId)).locked(user_);
        require(lock.amount > 0, "User had no lock to mirror");
        require(lock.end > block.timestamp, "Cannot mirror expired lock");

        bytes memory payload = abi.encodeWithSignature(
            "mirror_lock(address,uint256,uint256,uint256,uint256)",
            user_,chainId,_escrowId,lock.amount,lock.end
        );

        endpoint.anyCall(_toMirrorEscrow, payload, address(0), _toChainId);
    }

    function recoverFees() external onlyOwner {
        uint256 amount_ = endpoint.executionBudget(address(this));

        endpoint.withdraw(amount_);
        (bool success, ) = msg.sender.call{value: amount_}("");
        require(success, "Fee transfer failed");
    }

    function setEndpoint(ICallProxy _endpoint) external onlyOwner {
        endpoint = _endpoint;
    }

    function pause() external onlyOwner whenNotPaused {
        _pause();
    }

    function unPause() external onlyOwner whenPaused {
        _unpause();
    }

}
