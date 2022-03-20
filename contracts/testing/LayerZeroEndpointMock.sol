// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.0;
pragma abicoder v2;

import "../layer-zero/ILayerZeroEndpoint.sol";
import { ILayerZeroReceiver } from "../layer-zero/ILayerZeroReceiver.sol";

// MOCK
// heavily mocked LayerZero endpoint to facilitate same chain testing of two UserApplications
contract LayerZeroEndpointMock is ILayerZeroEndpoint {

    // inboundNonce = [srcChainId][srcAddress].
    mapping(uint16 => mapping(bytes => uint64)) public inboundNonce;
    // outboundNonce = [dstChainId][srcAddress].
    mapping(uint16 => mapping(address => uint64)) public outboundNonce;

    uint16 public chainId;
    uint16 public endpointId;
    uint public nativeFee;
    uint public zroFee;
    uint16 public sendVersion;
    uint16 public receiveVersion;

    constructor(uint16 _chainId){
        chainId = _chainId;
        endpointId = 1;
        sendVersion = 1;
        receiveVersion = 1;
    }

    // mock helper to set the value returned by `estimateNativeFees`
    function setEstimatedFees(uint _nativeFee, uint _zroFee) public {
        nativeFee = _nativeFee;
        zroFee = _zroFee;
    }

    // The user application on chain A (the source, or "from" chain) sends a message
    // to the communicator. It includes the following information:
    //      _chainId            - the destination chain identifier
    //      _destination        - the destination chain address (in bytes)
    //      _payload            - a the custom data to send
    //      _refundAddress      - address to send remainder funds to
    //      _zroPaymentAddress  - if 0x0, implies user app is paying in native token. otherwise
    //      txParameters        - optional data passed to the relayer via getPrices()
    function send(
        uint16 _chainId,
        bytes calldata _destination,
        bytes calldata _payload,
        address payable _refundAddress,
        address _zroPaymentAddress,
        bytes calldata txParameters
    ) override external payable {

        address destAddr = packedBytesToAddr(_destination);
        uint64 nonce;
        {
            nonce = outboundNonce[_chainId][destAddr]++;
        }

        bytes memory bytesSourceUserApplicationAddr = addrToPackedBytes(address(msg.sender)); // cast this address to bytes
        ILayerZeroReceiver(destAddr).lzReceive(chainId, bytesSourceUserApplicationAddr, nonce, _payload); // invoke lzReceive
    }

    // @notice gets a quote in source native gas, for the amount that send() requires to pay for message delivery
    // @param _dstChainId - the destination chain identifier
    // @param _userApplication - the user app address on this EVM chain
    // @param _payload - the custom message to send over LayerZero
    // @param _payInZRO - if false, user app pays the protocol fee in native token
    // @param _adapterParam - parameters for the adapter service, e.g. send some dust native token to dstChain
    function estimateFees(
        uint16 _dstChainId,
        address _userApplication,
        bytes calldata _payload,
        bool _payInZRO,
        bytes calldata _adapterParam
    ) external override view returns (uint _nativeFee, uint _zroFee){
        _nativeFee = nativeFee;
        _zroFee = zroFee;
    }

    // Define what library the UA points too
    function setSendVersion(uint16 _newVersion) external override {
        sendVersion = _newVersion;
    }

    function setReceiveVersion(uint16 _newVersion) external override {
        receiveVersion = _newVersion;
    }

    function forceResumeReceive(uint16 _srcChainId, bytes calldata _srcAddress) external override {
        //
    }

    function getInboundNonce(uint16 _chainID, bytes calldata _srcAddress) external view override returns (uint64) {
        return inboundNonce[_chainID][_srcAddress];
    }

    function getOutboundNonce(uint16 _chainID, address _srcAddress) external view override returns (uint64) {
        return outboundNonce[_chainID][_srcAddress];
    }

    function getChainId() external override view returns (uint16) {
        return 1;
    }

    function getConfig(uint16 _version, uint16 _chainId, address _userApplication, uint _configType) external override view returns (bytes memory) {
        return bytes("");
    }

    function getReceiveLibraryAddress(address _userApplication) external override view returns (address) {
        return address(0);
    }

    function getReceiveVersion(address _userApplication) external override view returns (uint16) {
        return 1;
    }

    function getSendLibraryAddress(address _userApplication) external override view returns (address) {
        return address(0);
    }

    function getSendVersion(address _userApplication) external override view returns (uint16) {
        return 1;
    }

    function hasStoredPayload(uint16 _srcChainId, bytes calldata _srcAddress) external override view returns (bool) {
        return false;
    }

    function isReceivingPayload() external override view returns (bool) {
        return false;
    }

    function isSendingPayload() external override view returns (bool) {
        return false;
    }

    function receivePayload(uint16 _srcChainId, bytes calldata _srcAddress, address _dstAddress, uint64 _nonce, uint _gasLimit, bytes calldata _payload) external override {

    }

    function retryPayload(uint16 _srcChainId, bytes calldata _srcAddress, bytes calldata _payload) external override {

    }

    function setConfig(uint16 _version, uint16 _chainId, uint _configType, bytes calldata _config) external override {

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

    function addrToPackedBytes(address _a) public pure returns (bytes memory){
        bytes memory data = abi.encodePacked(_a);
        return data;
    }

}

