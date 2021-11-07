# @version 0.2.12
"""
@title HND DAO Token proxy
@author Hundred Finanace
@license MIT
@notice configurable ERC20 with piecewise-linear mining supply.
@dev Based on the ERC-20 token standard as defined at
     https://eips.ethereum.org/EIPS/eip-20
"""

from vyper.interfaces import ERC20

event UpdateMiningParameters:
    time: uint256
    rate: uint256
    supply: uint256

event SetMinter:
    minter: address

event SetAdmin:
    admin: address

token: public(address)

minter: public(address)
admin: public(address)

# General constants
WEEK: constant(uint256) = 604800

# Supply parameters
INITIAL_RATE: constant(uint256) = 0
EPOCH_LENGTH_TIME: constant(uint256) = WEEK

RATE_DENOMINATOR: constant(uint256) = 10 ** 18

# Supply variables
start_epoch_time: public(uint256)
start_epoch_supply: uint256

first_epoch_time: public(uint256)
epoch_length: public(uint256)
rates: public(uint256[100000000000000000000000000000])

@external
def __init__(_token: address, _epoch_length: uint256):
    """
    @notice Contract constructor
    @param _token managed Token
    """
    self.token = _token

    self.admin = msg.sender

    self.epoch_length = _epoch_length
    self.start_epoch_time = block.timestamp
    self.first_epoch_time = self.start_epoch_time
    self.start_epoch_supply = 0


@internal
@view
def _epoch_at(_timestamp: uint256) -> uint256:
    """
    @notice gives current reward epoch number (0 for first epoch)
    @return uint256 epoch number
    """
    return (_timestamp - self.first_epoch_time) / EPOCH_LENGTH_TIME


@internal
@view
def _rate_at(_timestamp: uint256) -> uint256:
    """
    @notice give rewards emission rate for current epoch
    @return uint256 current epoch rate
    """
    return self.rates[self._epoch_at(_timestamp)]


@internal
@view
def _current_epoch() -> uint256:
    """
    @notice gives current reward epoch number (0 for first epoch)
    @return uint256 epoch number
    """
    return self._epoch_at(block.timestamp)
    

@external
def set_rate_at(_epoch: uint256, _rate: uint256):
    """
    @notice set future epoch reward rate
    """
    assert msg.sender == self.admin  # dev: admin only
    assert _epoch > self._current_epoch()  # dev: can only modify future rates

    self.rates[_epoch] = _rate


@internal
@view
def _current_rate() -> uint256:
    """
    @notice give rewards emission rate for current epoch
    @return uint256 current epoch rate
    """
    return self.rates[self._current_epoch()]


@internal
def _update_mining_parameters():
    """
    @dev Update mining rate and supply at the start of the epoch
         Any modifying mining call must also call this
    """

    _rate: uint256 = self._current_rate()
    _start_epoch_supply: uint256 = self.start_epoch_supply

    self.start_epoch_time += EPOCH_LENGTH_TIME

    if _rate != 0:
        _start_epoch_supply += _rate * EPOCH_LENGTH_TIME
        self.start_epoch_supply = _start_epoch_supply

    log UpdateMiningParameters(block.timestamp, _rate, _start_epoch_supply)


@external
@view
def rate() -> uint256:
    """
    @notice give rewards emission rate for current epoch
    @return uint256 current epoch rate
    """
    return self._current_rate()

@external
def update_mining_parameters():
    """
    @notice Update mining rate and supply at the start of the epoch
    @dev Callable by any address, but only once per epoch
         Total supply becomes slightly larger if this function is called late
    """
    assert block.timestamp >= self.start_epoch_time + EPOCH_LENGTH_TIME  # dev: too soon!
    self._update_mining_parameters()


@internal
def _start_epoch_time_write() -> uint256:
    """
    @notice Get timestamp of the current mining epoch start
            while simultaneously updating mining parameters
    @return Timestamp of the epoch
    """
    _start_epoch_time: uint256 = self.start_epoch_time
    if block.timestamp >= _start_epoch_time + EPOCH_LENGTH_TIME:
        self._update_mining_parameters()
        return self.start_epoch_time
    else:
        return _start_epoch_time


@external
def future_epoch_time_write() -> uint256:
    """
    @notice Get timestamp of the next mining epoch start
            while simultaneously updating mining parameters
    @return Timestamp of the next epoch
    """
    return self._start_epoch_time_write() + EPOCH_LENGTH_TIME


@external
def set_minter(_minter: address):
    """
    @notice Set the minter address
    @dev Only callable once, when minter has not yet been set
    @param _minter Address of the minter
    """
    assert msg.sender == self.admin  # dev: admin only
    assert self.minter == ZERO_ADDRESS  # dev: can set the minter only once, at creation
    self.minter = _minter
    log SetMinter(_minter)


@external
def set_admin(_admin: address):
    """
    @notice Set the new admin.
    @dev After all is set up, admin only can change the token name
    @param _admin New admin address
    """
    assert msg.sender == self.admin  # dev: admin only
    self.admin = _admin
    log SetAdmin(_admin)


@external
def mint(_to: address, _value: uint256) -> bool:
    """
    @notice Mint `_value` tokens and assign them to `_to`
    @dev Emits a Transfer event originating from 0x00
    @param _to The account that will receive the created tokens
    @param _value The amount that will be created
    @return bool success
    """
    assert msg.sender == self.minter  # dev: minter only
    assert _to != ZERO_ADDRESS  # dev: zero address

    if block.timestamp >= self.start_epoch_time + EPOCH_LENGTH_TIME:
        self._update_mining_parameters()

    return ERC20(self.token).transfer(_to, _value)
