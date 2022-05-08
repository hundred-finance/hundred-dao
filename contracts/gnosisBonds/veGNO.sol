// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Pausable } from "@openzeppelin/contracts/security/Pausable.sol";

contract veGNO is ERC20, Ownable, Pausable {

    IERC20 public gno;

    mapping(address => uint256) public burnedBalances;

    uint256 constant public YEAR = 365 * 24 * 3600;
    uint256 public unlockStartTime;

    constructor(IERC20 _gno, uint256 _unlockStartTime) ERC20("Vested Gnosis token", "vGNO") {
        gno = _gno;
        unlockStartTime = _unlockStartTime;
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

        gno.transfer(_msgSender(), gnoAmount_);
    }

    function unlockableAmount() public view returns(uint256) {
        uint256 currentTime_ = block.timestamp;
        uint256 halfTime_ = unlockStartTime + YEAR / 2;

        if (currentTime_ < halfTime_) {
            return 0;
        }

        uint256 amount_ = balanceOf(_msgSender());
        uint256 burnedAmount_ = burnedBalances[_msgSender()];
        uint256 totalAmount_ = amount_ + burnedAmount_;

        uint256 endTime_ = unlockStartTime + YEAR;
        uint256 halfAmount_ = totalAmount_ / 2;

        uint256 toUnlockAmount_ =
            halfAmount_
            + halfAmount_ * (currentTime_ - halfTime_) / (endTime_ - halfTime_)
            - burnedAmount_;

        if (toUnlockAmount_ > amount_) {
            return amount_;
        }

        return toUnlockAmount_;
    }

    function transfer(address recipient, uint256 amount) override public whenNotPaused returns (bool) {
        _transferBurnedBalance(_msgSender(), recipient, amount);
        return super.transfer(recipient, amount);
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) override public whenNotPaused returns (bool) {
        _transferBurnedBalance(sender, recipient, amount);
        return super.transferFrom(sender, recipient, amount);
    }

    function _transferBurnedBalance(address sender, address recipient, uint256 amount) internal {
        uint256 balance_ = balanceOf(sender);
        uint256 burnShareToTransfer = burnedBalances[sender] * amount / balance_;

        burnedBalances[recipient] += burnShareToTransfer;
        burnedBalances[sender] -= burnShareToTransfer;
    }

    function pause() external onlyOwner whenNotPaused {
        _pause();
    }

    function unPause() external onlyOwner whenPaused {
        _unpause();
    }

    function sweep() external onlyOwner {
        gno.transfer(_msgSender(), gno.balanceOf(address(this)));
    }
}
