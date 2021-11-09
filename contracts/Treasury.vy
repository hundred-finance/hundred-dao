# @version 0.2.12
"""
@title Token Treasury
@author Curve Finance
@license MIT
"""

from vyper.interfaces import ERC20


token: public(address)
minter: public(address)

@external
def __init__(_token: address, _minter: address):
    self.token = _token
    self.minter = _minter

@external
def mint(_amount: uint256, _to: address) -> bool:
    assert msg.sender == self.minter  # only minter can distribute tokens
    return ERC20(self.token).transfer(_to, _amount)