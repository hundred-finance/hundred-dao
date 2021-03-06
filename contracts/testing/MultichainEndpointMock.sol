// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../multichain/IAnyswapV6CallProxy.sol";
import "../multichain/IApp.sol";

contract MultichainEndpointMock is IAnyswapV6CallProxy {

    constructor(uint256 _chainId) {
        sourceChainId = _chainId;
        executor = new AnyCallExecutor();
    }

    mapping(address => uint256) public override executionBudget;

    address private caller;
    uint256 private sourceChainId;

    AnyCallExecutor public override executor;

    function anyCall(
        address _to,
        bytes calldata _data,
        address _fallback,
        uint256 _toChainID,
        uint256 _flags
    ) override external payable {
        require(msg.value == _calcSrcFees(address(0), _toChainID, _data.length), "Incorrect fee amount");

        caller = msg.sender;

        executor.execute(_to, _data, caller, sourceChainId, 1);
    }

    function calcSrcFees(
        address _app,
        uint256 _toChainID,
        uint256 _dataLength
    ) override external pure returns (uint256) {
        return _calcSrcFees(_app, _toChainID, _dataLength);
    }

    function _calcSrcFees(
        address _app,
        uint256 _toChainID,
        uint256 _dataLength
    ) internal pure returns (uint256) {
        return 1000 * _dataLength;
    }

    function deposit(address _account) override external payable {}

    function withdraw(uint256 _amount) override external {
        payable(msg.sender).transfer(_amount);
    }

}

