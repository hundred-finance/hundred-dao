pragma solidity ^0.8.0;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Pausable } from "@openzeppelin/contracts/security/Pausable.sol";

struct LockedBalance {
    int128 amount;
    uint256 end;
}

interface VotingEscrow {
    function locked(address _addr) external view returns(LockedBalance memory);
    function deposit_for(address _addr, uint256 _value) external;
    function create_lock_for(address _addr, uint256 _value, uint256 _unlock_time) external;
}

contract HundredBond is ERC20, Ownable, Pausable {

    ERC20 public hnd;

    VotingEscrow public escrow;
    bool public escrow_is_v2;

    uint256 public bondUnlockTime;

    constructor(
        ERC20 _hnd,
        VotingEscrow _escrow,
        bool _escrow_is_v2,
        uint256 _bondUnlockTime
    ) ERC20("Hundred Bond", "HNDb") {
        hnd = _hnd;
        escrow = _escrow;
        escrow_is_v2 = _escrow_is_v2;
        bondUnlockTime = _bondUnlockTime;
    }

    function burn(uint256 amount) external whenNotPaused {
        _burn(_msgSender(), amount);
        hnd.transfer(owner(), amount);
    }

    function redeem() external whenNotPaused {
        address beneficiary_ = _msgSender();
        uint256 balance_ = balanceOf(_msgSender());

        require(balance_ > 0, "Insufficient bond balance to redeem");

        LockedBalance memory locked_ = escrow.locked(beneficiary_);

        if (escrow_is_v2 == false) {
            require(locked_.end >= bondUnlockTime, "HND lock need to be extended or created");
            hnd.transfer(beneficiary_, balance_);
            escrow.deposit_for(beneficiary_, balance_);
        } else if (locked_.end == 0) {
            escrow.create_lock_for(beneficiary_, balance_, bondUnlockTime);
        } else {
            require(locked_.end >= bondUnlockTime, "HND lock need to be extended");
            escrow.deposit_for(beneficiary_, balance_);
        }

        _burn(beneficiary_, balance_);
    }

    function mint(address account, uint256 amount) external onlyOwner whenNotPaused {
        hnd.transferFrom(owner(), address(this), amount);
        _mint(account, amount);
    }

    function pause() external onlyOwner whenNotPaused {
        _pause();
    }

    function unPause() external onlyOwner whenPaused {
        _unpause();
    }
}
