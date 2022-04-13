// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Pausable } from "@openzeppelin/contracts/security/Pausable.sol";

struct LockedBalance {
    int128 amount;
    uint256 end;
}

interface IVotingEscrow {
    function locked(address _addr) external view returns(LockedBalance memory);
    function deposit_for(address _addr, uint256 _value) external;
    function create_lock_for(address _addr, uint256 _value, uint256 _unlock_time) external;
}

contract HundredBond is ERC20, Ownable, Pausable {

    uint256 public WEEK = 7 * 86400;

    ERC20 public hnd;
    uint256 public hndRescueTime;

    IVotingEscrow public escrow;
    bool public escrow_is_v2;

    uint256 public bondUnlockDuration;

    constructor(
        ERC20 _hnd,
        IVotingEscrow _escrow,
        bool _escrow_is_v2,
        uint256 _bondUnlockDuration
    ) ERC20("Hundred Bond", "HNDb") {
        hnd = _hnd;
        escrow = _escrow;
        escrow_is_v2 = _escrow_is_v2;
        bondUnlockDuration = _bondUnlockDuration;
        hndRescueTime = block.timestamp + 51 * WEEK;
    }

    function mint(address _account, uint256 _amount) external onlyOwner whenNotPaused {
        hnd.transferFrom(owner(), address(this), _amount);
        _mint(_account, _amount);
    }

    function burn(uint256 _amount) external whenNotPaused {
        _burn(_msgSender(), _amount);
        hnd.transfer(owner(), _amount);
    }

    function redeem() external whenNotPaused {
        address beneficiary_ = _msgSender();
        uint256 balance_ = balanceOf(_msgSender());

        require(balance_ > 0, "Insufficient bond balance to redeem");

        LockedBalance memory locked_ = escrow.locked(beneficiary_);
        uint256 unlockTime_ = block.timestamp + bondUnlockDuration;

        if (escrow_is_v2 == false) {
            require(locked_.end >= unlockTime_, "HND lock needs to be extended or created");
            hnd.transfer(beneficiary_, balance_);
            escrow.deposit_for(beneficiary_, balance_);
        } else if (locked_.end == 0) {
            hnd.approve(address(escrow), balance_);
            escrow.create_lock_for(beneficiary_, balance_, unlockTime_);
        } else {
            require(locked_.end >= unlockTime_, "HND lock needs to be extended");
            hnd.approve(address(escrow), balance_);
            escrow.deposit_for(beneficiary_, balance_);
        }

        _burn(beneficiary_, balance_);
    }

    function pause() external onlyOwner whenNotPaused {
        _pause();
    }

    function unPause() external onlyOwner whenPaused {
        _unpause();
    }

    function rescueHnd() external onlyOwner {
        require(block.timestamp > hndRescueTime, "Cannot rescue before 1 year");
        uint256 balance_ = hnd.balanceOf(address(this));
        hnd.transfer(owner(), balance_);
    }
}
