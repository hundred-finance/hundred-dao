// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestERC20 is ERC20 {

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function mint(address _account, uint256 _amount) external {
        _mint(_account, _amount);
    }
}
