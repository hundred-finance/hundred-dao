// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Pausable } from "@openzeppelin/contracts/security/Pausable.sol";
import { MerkleProof } from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

import "./ExternalMulticall.sol";

contract MerkleClaimMultipleERC20 is ExternalMulticall, Ownable, Pausable {

    DropMetadata[] public drops;

    constructor() {}

    function claim(address _to, uint256[] calldata _amounts, bytes32[] calldata _proof, uint _dropId) external whenNotPaused {
        require(_dropId < drops.length, "Invalid drop id");

        DropMetadata storage drop_ = drops[_dropId];

        require(drop_.isClosed == false, "Drop is closed");
        require(drop_.hasClaimed[_to] == false, "Already Claimed");

        bytes32 leaf_ = keccak256(abi.encodePacked(_to, _amounts));
        bool isValidLeaf_ = MerkleProof.verify(_proof, drop_.merkleRoot, leaf_);
        require(isValidLeaf_ == true, "Not Valid Merkle proof");

        drop_.hasClaimed[_to] = true;

        for (uint i = 0; i < drop_.tokens.length; i++) {
            IERC20 token_ = drop_.tokens[i];
            uint256 amount_ = _amounts[i];

            token_.transfer(_to, amount_);
            emit Claim(_dropId, _to, address(token_), amount_);
        }
    }

    function setNewDrop(bytes32 _merkleRoot, IERC20[] calldata _tokens) external onlyOwner {
        uint256 index_ = drops.length;
        drops.push();

        DropMetadata storage newDrop_ = drops[index_];
        newDrop_.merkleRoot = _merkleRoot;
        newDrop_.tokens = _tokens;
    }

    function closeDrop(uint _dropId) external onlyOwner {
        drops[_dropId].isClosed = true;
    }

    function sweepUnclaimedFunds(IERC20 _token) external onlyOwner {
        if (!paused()) {
            _pause();
        }
        _token.transfer(_msgSender(), _token.balanceOf(address(this)));
    }

    function pause() external onlyOwner whenNotPaused {
        _pause();
    }

    function unPause() external onlyOwner whenPaused {
        _unpause();
    }

    struct DropMetadata {
        bool isClosed;
        bytes32 merkleRoot;
        IERC20[] tokens;
        mapping(address => bool) hasClaimed;
    }

    event Claim(uint indexed dropId, address indexed to, address token, uint256 amount);

}