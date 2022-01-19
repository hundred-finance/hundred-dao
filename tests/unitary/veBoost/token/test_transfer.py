import brownie
import pytest
from brownie import ZERO_ADDRESS


@pytest.fixture(autouse=True)
def setup(alice, chain, veboost_delegation, alice_unlock_time, lock_alice):
    veboost_delegation.create_boost(alice, alice, 5000, 0, chain.time() + 86400 * 31, 0, {"from": alice})


def test_transfer_token(alice, bob, veboost_delegation):
    token_id = veboost_delegation.get_token_id(alice, 0)
    veboost_delegation.transferFrom(alice, bob, token_id, {"from": alice})

    assert veboost_delegation.ownerOf(token_id) == bob
    assert veboost_delegation.balanceOf(alice) == 0
    assert veboost_delegation.balanceOf(bob) == 1


def test_transfer_token_approved(alice, bob, veboost_delegation):
    token_id = veboost_delegation.get_token_id(alice, 0)
    veboost_delegation.approve(bob, token_id, {"from": alice})
    veboost_delegation.transferFrom(alice, bob, token_id, {"from": bob})

    assert veboost_delegation.ownerOf(token_id) == bob


def test_transfer_token_operator(alice, bob, veboost_delegation):
    token_id = veboost_delegation.get_token_id(alice, 0)
    veboost_delegation.setApprovalForAll(bob, True, {"from": alice})
    veboost_delegation.transferFrom(alice, bob, token_id, {"from": bob})

    assert veboost_delegation.ownerOf(token_id) == bob


def test_no_safety_check(alice, veboost_delegation):
    token_id = veboost_delegation.get_token_id(alice, 0)
    veboost_delegation.transferFrom(alice, veboost_delegation, token_id, {"from": alice})

    assert veboost_delegation.ownerOf(token_id) == veboost_delegation


def test_transfer_event_fires(alice, bob, veboost_delegation):
    token_id = veboost_delegation.get_token_id(alice, 0)
    tx = veboost_delegation.transferFrom(alice, bob, token_id, {"from": alice})

    assert "Transfer" in tx.events
    assert tx.events["Transfer"] == dict(_from=alice, _to=bob, _token_id=token_id)


def test_transfer_updates_enumerations(alice, bob, chain, veboost_delegation):
    token_id = veboost_delegation.get_token_id(alice, 10_000)
    veboost_delegation.create_boost(
        alice, alice, 10_000, 0, chain.time() + 86400 * 31, 10_000, {"from": alice}
    )
    veboost_delegation.transferFrom(alice, bob, token_id, {"from": alice})

    assert veboost_delegation.tokenByIndex(0) == veboost_delegation.get_token_id(alice, 0)
    assert veboost_delegation.tokenByIndex(1) == token_id
    assert veboost_delegation.tokenOfOwnerByIndex(alice, 0) == veboost_delegation.get_token_id(alice, 0)
    assert veboost_delegation.tokenOfOwnerByIndex(alice, 1) == 0
    assert veboost_delegation.tokenOfOwnerByIndex(bob, 0) == token_id
    assert veboost_delegation.totalSupply() == 2


def test_neither_owner_nor_approved(alice, bob, veboost_delegation):
    with brownie.reverts(dev_revert_msg="dev: neither owner nor approved"):
        token_id = veboost_delegation.get_token_id(alice, 0)
        veboost_delegation.transferFrom(alice, bob, token_id, {"from": bob})


def test_transfer_to_null_account_reverts(alice, veboost_delegation):
    with brownie.reverts(dev_revert_msg="dev: transfers to ZERO_ADDRESS are disallowed"):
        token_id = veboost_delegation.get_token_id(alice, 0)
        veboost_delegation.transferFrom(alice, ZERO_ADDRESS, token_id, {"from": alice})


def test_from_address_is_not_owner(alice, bob, veboost_delegation):
    with brownie.reverts(dev_revert_msg="dev: _from is not owner"):
        token_id = veboost_delegation.get_token_id(alice, 0)
        veboost_delegation.transferFrom(bob, alice, token_id, {"from": alice})
