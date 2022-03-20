// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./layer-zero/ILayerZeroReceiver.sol";
import "./layer-zero/ILayerZeroEndpoint.sol";

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Pausable } from "@openzeppelin/contracts/security/Pausable.sol";

import "hardhat/console.sol";

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

contract MirrorGate is ILayerZeroReceiver, Ownable, Pausable {

    IMirroredVotingEscrow public mirrorEscrow;

    ILayerZeroEndpoint public endpoint;

    mapping(uint256 => bytes) public mirrorGates;

    event MirrorSuccess(
        address _enpoint,
        bytes _srcAddress,
        uint64 _nonce,
        address _to,
        uint16 _chain,
        uint256 _escrow_id,
        uint256 _value,
        uint256 _unlock_time
    );

    event MirrorFailure(
        address _enpoint,
        uint16 _srcChainId,
        bytes _srcAddress,
        uint64 _nonce,
        bytes _payload
    );

    constructor(ILayerZeroEndpoint _endpoint, IMirroredVotingEscrow _mirrorEscrow) {
        endpoint = _endpoint;
        mirrorEscrow = _mirrorEscrow;
    }

    function lzReceive(
        uint16 _srcChainId,
        bytes calldata _srcAddress,
        uint64 _nonce,
        bytes calldata _payload
    ) override external whenNotPaused {

        console.log("lzReceive chain", _srcChainId);
        console.log("lzReceive src", packedBytesToAddr(_srcAddress));
        console.log("lzReceive called gate", address(this));

        require(msg.sender == address(endpoint), "Not allowed LayerZero endpoint");
        require(
            _srcAddress.length == mirrorGates[_srcChainId].length &&
            keccak256(_srcAddress) == keccak256(mirrorGates[_srcChainId]),
            "Unsupported source mirror gate"
        );

        (address to_, uint256 escrowId_, uint256 value_, uint256 end_) =
            abi.decode(_payload, (address, uint256, uint256, uint256));

        try mirrorEscrow.mirror_lock(to_, _srcChainId, escrowId_, value_, end_) {
            emit MirrorSuccess(address(endpoint), _srcAddress, _nonce, to_, _srcChainId, escrowId_, value_, end_);
        } catch {
            emit MirrorFailure(address(endpoint), _srcChainId, _srcAddress, _nonce, _payload);
        }
    }

    function mirrorLock(
        uint16 _toChainId,
        uint256 _escrowId
    ) external whenNotPaused payable {
        bytes memory mirrorGate_ = mirrorGates[_toChainId];
        address user_ = _msgSender();

        require(mirrorGate_.length > 0, "Unsupported target chain id ");
        require(_escrowId < mirrorEscrow.voting_escrow_count(), "Unsupported escrow id");

        LockedBalance memory lock = IVotingEscrow(mirrorEscrow.voting_escrows(_escrowId)).locked(user_);
        require(lock.amount > 0, "User had no lock to mirror");
        require(lock.end > block.timestamp, "Cannot mirror expired lock");

        bytes memory payload = abi.encode(user_, _escrowId, lock.amount, lock.end);

        endpoint.send{value: msg.value}(
            _toChainId,
            mirrorGate_,
            payload,
            payable(user_),
            address(0),
            bytes("")
        );
    }

    function setEndpoint(ILayerZeroEndpoint _endpoint) external onlyOwner {
        endpoint = _endpoint;
    }

    function setMirrorGate(uint256 _chainId, bytes calldata _gate) external onlyOwner {
        mirrorGates[_chainId] = _gate;
    }

    function pause() external onlyOwner whenNotPaused {
        _pause();
    }

    function unPause() external onlyOwner whenPaused {
        _unpause();
    }

    function packedBytesToAddr(bytes calldata _b) public pure returns (address){
        address addr;
        assembly {
            let ptr := mload(0x40)
            calldatacopy(ptr, sub(_b.offset, 2 ), add(_b.length, 2))
            addr := mload(sub(ptr,10))
        }
        return addr;
    }

}
