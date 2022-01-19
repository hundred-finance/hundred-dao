import math

import brownie
import pytest
from brownie import ZERO_ADDRESS, convert

pytestmark = pytest.mark.usefixtures("lock_alice")


DAY = 86400
WEEK = DAY * 7


def test_create_a_boost(alice, bob, chain, alice_unlock_time, veboost_delegation, voting_escrow):
    veboost_delegation.create_boost(alice, bob, 10_000, 0, alice_unlock_time, 0, {"from": alice})
    token_id = convert.to_uint(alice.address) << 96

    alice_adj_balance = veboost_delegation.adjusted_balance_of(alice)
    bob_adj_balance = veboost_delegation.adjusted_balance_of(bob)

    alice_delgated_boost = veboost_delegation.delegated_boost(alice)
    bob_received_boost = veboost_delegation.received_boost(bob)

    alice_voting_escrow_balance = voting_escrow.balanceOf(alice)
    token_boost_value = veboost_delegation.token_boost(token_id)

    assert alice_adj_balance == 0
    assert bob_adj_balance == alice_voting_escrow_balance
    assert bob_received_boost == alice_delgated_boost
    assert token_boost_value == alice_delgated_boost
    assert veboost_delegation.token_expiry(token_id) == (alice_unlock_time // WEEK) * WEEK


def test_create_a_boost_updates_delegator_enumeration(alice, bob, alice_unlock_time, veboost_delegation):
    veboost_delegation.create_boost(alice, bob, 10_000, 0, alice_unlock_time, 0, {"from": alice})
    token_id = convert.to_uint(alice.address) << 96

    assert veboost_delegation.total_minted(alice) == 1
    assert veboost_delegation.token_of_delegator_by_index(alice, 0) == token_id


def test_boost_self(alice, chain, alice_unlock_time, veboost_delegation, voting_escrow):
    veboost_delegation.create_boost(alice, alice, 10_000, 0, alice_unlock_time, 0, {"from": alice})

    alice_adj_balance = veboost_delegation.adjusted_balance_of(alice)
    alice_voting_escrow_balance = voting_escrow.balanceOf(alice)

    assert alice_adj_balance == alice_voting_escrow_balance


def test_operator_can_create_boost(alice, bob, chain, alice_unlock_time, veboost_delegation, voting_escrow):
    veboost_delegation.setApprovalForAll(bob, True, {"from": alice})
    veboost_delegation.create_boost(alice, bob, 10_000, 0, alice_unlock_time, 0, {"from": bob})

    alice_adj_balance = veboost_delegation.adjusted_balance_of(alice)
    bob_adj_balance = veboost_delegation.adjusted_balance_of(bob)
    alice_voting_escrow_balance = voting_escrow.balanceOf(alice)

    assert alice_adj_balance == 0
    assert bob_adj_balance == alice_voting_escrow_balance


def test_invalid_slope(alice, charlie, chain, token, voting_escrow, veboost_delegation):
    # slope can be equal to 0 due to integer division, as the
    # amount of boost we are delegating is divided by the length of the
    # boost period, in which case if abs(y) < boost period, the slope will be 0
    amount = (DAY * 365 * 4 // WEEK) * WEEK  # very small amount
    unlock_time = ((chain.time() + amount) // WEEK) * WEEK
    token.mint(alice, amount * 10, {"from": alice})
    token.transfer(charlie, amount * 10, {"from": alice})
    token.approve(voting_escrow, amount * 10, {"from": charlie})
    voting_escrow.create_lock(amount * 10, unlock_time, {"from": charlie})

    with brownie.reverts(dev_revert_msg="dev: invalid slope"):
        veboost_delegation.create_boost(charlie, alice, 1_000, 0, unlock_time, 0, {"from": charlie})


@pytest.mark.parametrize("percentage", range(1, 10, 1))
def test_varying_percentage_of_available_boost(
    alice, bob, chain, alice_unlock_time, veboost_delegation, voting_escrow, percentage
):
    veboost_delegation.create_boost(
        alice, bob, int(10_000 * percentage / 10), 0, alice_unlock_time, 0, {"from": alice}
    )

    alice_adj_balance = veboost_delegation.adjusted_balance_of(alice)
    bob_adj_balance = veboost_delegation.adjusted_balance_of(bob)
    alice_voting_escrow_balance = voting_escrow.balanceOf(alice)

    assert math.isclose(alice_adj_balance, alice_voting_escrow_balance * (1 - percentage / 10))
    assert math.isclose(bob_adj_balance, alice_voting_escrow_balance * percentage / 10)


def test_negative_outstanding_boosts(alice, chain, alice_unlock_time, veboost_delegation):
    expiry = ((chain.time() // WEEK) * WEEK) + 2 * WEEK
    veboost_delegation.create_boost(alice, alice, 10_000, 0, expiry, 0, {"from": alice})
    chain.mine(timestamp=expiry + 1)
    with brownie.reverts(dev_revert_msg="dev: negative boost token is in circulation"):
        veboost_delegation.create_boost(alice, alice, 5_000, 0, alice_unlock_time, 1, {"from": alice})


def test_no_boost_available_to_delegate_reverts(alice, alice_unlock_time, veboost_delegation):
    veboost_delegation.create_boost(alice, alice, 10_000, 0, alice_unlock_time, 0, {"from": alice})
    with brownie.reverts(dev_revert_msg="dev: no boost"):
        veboost_delegation.create_boost(alice, alice, 5_000, 0, alice_unlock_time, 1, {"from": alice})


def test_implicit_token_existence_check(alice, alice_unlock_time, veboost_delegation):
    veboost_delegation.create_boost(alice, alice, 10_000, 0, alice_unlock_time, 0, {"from": alice})
    with brownie.reverts(dev_revert_msg="dev: token exists"):
        veboost_delegation.create_boost(alice, alice, 10_000, 0, alice_unlock_time, 0, {"from": alice})


def test_id_out_of_bounds(alice, alice_unlock_time, veboost_delegation):
    with brownie.reverts(dev_revert_msg="dev: id out of bounds"):
        veboost_delegation.create_boost(alice, alice, 10_000, 0, alice_unlock_time, 2 ** 96, {"from": alice})


def test_expire_time_after_lock_expiry_reverts(alice, voting_escrow, veboost_delegation):
    with brownie.reverts(dev_revert_msg="dev: boost expiration is past voting escrow lock expiry"):
        veboost_delegation.create_boost(
            alice, alice, 10_000, 0, voting_escrow.locked__end(alice) + WEEK, 0, {"from": alice}
        )


def test_expire_time_below_min_time_reverts(alice, chain, veboost_delegation):
    with brownie.reverts(dev_revert_msg="dev: boost duration must be atleast WEEK"):
        veboost_delegation.create_boost(alice, alice, 10_000, 0, chain.time() + 3600, 0, {"from": alice})


def test_cancel_time_after_expiry_reverts(alice, alice_unlock_time, veboost_delegation):
    with brownie.reverts(dev_revert_msg="dev: cancel time is after expiry"):
        veboost_delegation.create_boost(
            alice, alice, 10_000, alice_unlock_time + 1, alice_unlock_time, 0, {"from": alice}
        )


@pytest.mark.parametrize(
    "pct,msg",
    [
        (0, "dev: percentage must be greater than 0 bps"),
        (10_001, "dev: percentage must be less than 10_000 bps"),
    ],
)
def test_invalid_boost_percentage(alice, alice_unlock_time, veboost_delegation, pct, msg):
    with brownie.reverts(msg):
        veboost_delegation.create_boost(alice, alice, pct, 0, alice_unlock_time, 0, {"from": alice})


def test_boost_zero_address_reverts(alice, alice_unlock_time, veboost_delegation):
    with brownie.reverts(dev_revert_msg="dev: minting to ZERO_ADDRESS disallowed"):
        veboost_delegation.create_boost(alice, ZERO_ADDRESS, 10_000, 0, alice_unlock_time, 0, {"from": alice})
