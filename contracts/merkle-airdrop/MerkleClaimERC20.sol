// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Pausable } from "@openzeppelin/contracts/security/Pausable.sol";
import { MerkleProof } from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract MerkleClaimERC20 is Ownable, Pausable {

    bytes32 public immutable merkleRoot;

    IERC20 public claimToken;

    mapping(address => bool) public hasClaimed;

    constructor(bytes32 _merkleRoot, IERC20 _claimToken) {
        merkleRoot = _merkleRoot;
        claimToken = _claimToken;
    }

    event Claim(address indexed to, uint256 amount);

    function claim(address to, uint256 amount, bytes32[] calldata proof) external whenNotPaused {
        require(hasClaimed[to] == false, "Already Claimed");

        bytes32 leaf = keccak256(abi.encodePacked(to, amount));
        bool isValidLeaf = MerkleProof.verify(proof, merkleRoot, leaf);
        require(isValidLeaf == true, "Not Valid Merkle proof");

        hasClaimed[to] = true;

        claimToken.transfer(to, amount);

        emit Claim(to, amount);
    }

    function pause() external onlyOwner whenNotPaused {
        _pause();
    }

    function unPause() external onlyOwner whenPaused {
        _unpause();
    }

    function sweepRemainingFunds() external onlyOwner {
        if (!paused()) {
            _pause();
        }
        claimToken.transfer(_msgSender(), claimToken.balanceOf(address(this)));
    }
}