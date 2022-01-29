// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Address.sol";

abstract contract ExternalMulticall {

    struct CallData {
        address target;
        bytes data;
    }

    /**
    * @dev Receives and executes a batch of function calls on this contract.
    */
    function multicall(CallData[] calldata data) external payable returns (bytes[] memory results) {
        results = new bytes[](data.length);
        for (uint i = 0; i < data.length; i++) {
            results[i] = Address.functionCall(data[i].target, data[i].data);
        }
        return results;
    }
}
