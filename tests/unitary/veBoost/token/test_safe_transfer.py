import brownie
import pytest
from brownie import ZERO_ADDRESS
from brownie.convert.datatypes import HexString


@pytest.fixture(autouse=True)
def setup(alice, chain, veboost_delegation, alice_unlock_time, lock_alice):
    veboost_delegation.create_boost(alice, alice, 5000, 0, chain.time() + 86400 * 31, 0, {"from": alice})


def test_transfer_token(alice, bob, veboost_delegation):
    token_id = veboost_delegation.get_token_id(alice, 0)
    veboost_delegation.safeTransferFrom(alice, bob, token_id, {"from": alice})

    assert veboost_delegation.ownerOf(token_id) == bob
    assert veboost_delegation.balanceOf(alice) == 0
    assert veboost_delegation.balanceOf(bob) == 1


def test_transfer_token_approved(alice, bob, veboost_delegation):
    token_id = veboost_delegation.get_token_id(alice, 0)
    veboost_delegation.approve(bob, token_id, {"from": alice})
    veboost_delegation.safeTransferFrom(alice, bob, token_id, {"from": bob})

    assert veboost_delegation.ownerOf(token_id) == bob


def test_transfer_token_operator(alice, bob, veboost_delegation):
    token_id = veboost_delegation.get_token_id(alice, 0)
    veboost_delegation.setApprovalForAll(bob, True, {"from": alice})
    veboost_delegation.safeTransferFrom(alice, bob, token_id, {"from": bob})

    assert veboost_delegation.ownerOf(token_id) == bob


def test_safety_check_success(alice, pm, veboost_delegation):
    ERC721ReceiverMock = pm("OpenZeppelin/openzeppelin-contracts@4.2.0").ERC721ReceiverMock
    ret_val = ERC721ReceiverMock.signatures["onERC721Received"]
    mock_receiver = ERC721ReceiverMock.deploy(ret_val, 0, {"from": alice})

    token_id = veboost_delegation.get_token_id(alice, 0)

    veboost_delegation.safeTransferFrom(alice, mock_receiver, token_id, {"from": alice})

    assert veboost_delegation.ownerOf(token_id) == mock_receiver


def test_fourth_argument_passed_to_contract_in_subcall(alice, pm, veboost_delegation):
    ERC721ReceiverMock = pm("OpenZeppelin/openzeppelin-contracts@4.2.0").ERC721ReceiverMock
    ret_val = ERC721ReceiverMock.signatures["onERC721Received"]
    mock_receiver = ERC721ReceiverMock.deploy(ret_val, 0, {"from": alice})

    token_id = veboost_delegation.get_token_id(alice, 0)
    tx = veboost_delegation.safeTransferFrom(alice, mock_receiver, token_id, b"Hello world!", {"from": alice})

    expected = {
        "from": veboost_delegation,
        "function": "onERC721Received(address,address,uint256,bytes)",
        "inputs": {
            "data": HexString(b"Hello world!", "bytes"),
            "from": alice,
            "operator": alice,
            "tokenId": token_id,
        },
        "op": "CALL",
        "to": mock_receiver,
        "value": 0,
    }

    assert tx.subcalls[0] == expected


def test_transfer_event_fires(alice, bob, veboost_delegation):
    token_id = veboost_delegation.get_token_id(alice, 0)
    tx = veboost_delegation.safeTransferFrom(alice, bob, token_id, {"from": alice})

    assert "Transfer" in tx.events
    assert tx.events["Transfer"] == dict(_from=alice, _to=bob, _token_id=token_id)


def test_safety_check_fail(alice, pm, veboost_delegation):
    ERC721ReceiverMock = pm("OpenZeppelin/openzeppelin-contracts@4.2.0").ERC721ReceiverMock
    mock_receiver = ERC721ReceiverMock.deploy("0x00c0fFEe", 1, {"from": alice})

    token_id = veboost_delegation.get_token_id(alice, 0)
    with brownie.reverts():
        veboost_delegation.safeTransferFrom(alice, mock_receiver, token_id, {"from": alice})


def test_neither_owner_nor_approved(alice, bob, veboost_delegation):
    token_id = veboost_delegation.get_token_id(alice, 0)

    with brownie.reverts(dev_revert_msg="dev: neither owner nor approved"):
        veboost_delegation.safeTransferFrom(alice, bob, token_id, {"from": bob})


def test_transfer_to_null_account_reverts(alice, veboost_delegation):
    token_id = veboost_delegation.get_token_id(alice, 0)

    with brownie.reverts(dev_revert_msg="dev: transfers to ZERO_ADDRESS are disallowed"):
        veboost_delegation.safeTransferFrom(alice, ZERO_ADDRESS, token_id, {"from": alice})


def test_from_address_is_not_owner(alice, bob, veboost_delegation):
    token_id = veboost_delegation.get_token_id(alice, 0)

    with brownie.reverts(dev_revert_msg="dev: _from is not owner"):
        veboost_delegation.safeTransferFrom(bob, alice, token_id, {"from": alice})
