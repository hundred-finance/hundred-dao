// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Pausable } from "@openzeppelin/contracts/security/Pausable.sol";

contract veGNO is ERC20, Ownable, Pausable {

    uint256 constant public HALF_YEAR = 365 * 24 * 1800;

    IERC20 immutable public gno;
    uint256 immutable public unlockHalfTime;

    mapping(address => uint256) public burnedBalances;

    constructor(IERC20 _gno, uint256 _unlockStartTime) ERC20("Vested Gnosis token", "vGNO") {
        gno = _gno;
        unlockHalfTime = _unlockStartTime + HALF_YEAR;
    }

    function mint(address _account, uint256 _amount) external onlyOwner {
        gno.transferFrom(_msgSender(), address(this), _amount);
        _mint(_account, _amount);
    }

    function burn() external {
        uint256 amount_ = balanceOf(_msgSender());

        burnedBalances[_msgSender()] = 0;
        _burn(_msgSender(), amount_);

        gno.transfer(owner(), amount_);
    }

    function redeem() external whenNotPaused {
        uint256 gnoAmount_ = unlockableAmount();

        require(gnoAmount_ > 0, "Nothing to redeem");

        _burn(_msgSender(), gnoAmount_);
        burnedBalances[_msgSender()] = gnoAmount_;
        burnedBalances[address(0)] = 0;

        gno.transfer(_msgSender(), gnoAmount_);
    }

    function unlockableAmount() public view returns(uint256) {
        uint256 currentTime_ = block.timestamp;
        if (currentTime_ < unlockHalfTime) {
            return 0;
        }

        uint256 amount_ = balanceOf(_msgSender());
        uint256 burnedAmount_ = burnedBalances[_msgSender()];
        uint256 totalAmount_ = amount_ + burnedAmount_;
        uint256 halfAmount_ = totalAmount_ / 2;

        uint256 toUnlockAmount_ =
            halfAmount_
            + halfAmount_ * (currentTime_ - unlockHalfTime) / HALF_YEAR
            - burnedAmount_;
        if (toUnlockAmount_ > amount_) {
            return amount_;
        }

        return toUnlockAmount_;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) override internal virtual whenNotPaused {
        uint256 balance_ = balanceOf(from);
        if (balance_ == 0) {
            return;
        }

        uint256 burnShareToTransfer = burnedBalances[from] * amount / balance_;
        burnedBalances[to] += burnShareToTransfer;
        burnedBalances[from] -= burnShareToTransfer;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unPause() external onlyOwner {
        _unpause();
    }

    function sweep() external onlyOwner {
        gno.transfer(_msgSender(), gno.balanceOf(address(this)));
    }
}
