import itertools as it
import math

import brownie
import pytest

DAY = 86400
WEEK = DAY * 7


pytestmark = pytest.mark.usefixtures("boost_bob")


@pytest.mark.parametrize("expiry_delta,cancel_delta", it.product([0, 1], repeat=2))
def test_extend_an_existing_boost_modify_(
    alice, expire_time, veboost_delegation, cancel_time, expiry_delta, cancel_delta
):
    token = veboost_delegation.get_token_id(alice, 0)
    original_boost_value = veboost_delegation.token_boost(token)
    veboost_delegation.extend_boost(
        token, 7_500, expire_time + expiry_delta, cancel_time + cancel_delta, {"from": alice}
    )

    assert math.isclose(veboost_delegation.token_boost(token), original_boost_value * 1.5, rel_tol=1e-6)
    assert veboost_delegation.token_expiry(token) == ((expire_time + expiry_delta) // WEEK) * WEEK
    assert veboost_delegation.token_cancel_time(token) == cancel_time + cancel_delta


def test_delegator_operator_can_extend_a_boost(alice, bob, expire_time, veboost_delegation, cancel_time):
    veboost_delegation.setApprovalForAll(bob, True, {"from": alice})

    token = veboost_delegation.get_token_id(alice, 0)
    original_boost_value = veboost_delegation.token_boost(token)
    veboost_delegation.extend_boost(token, 7_500, expire_time + WEEK, cancel_time + 1, {"from": alice})

    assert math.isclose(veboost_delegation.token_boost(token), original_boost_value * 1.5, rel_tol=10 ** -6)
    assert veboost_delegation.token_expiry(token) == expire_time + WEEK
    assert veboost_delegation.token_cancel_time(token) == cancel_time + 1


def test_only_delegator_or_operator(alice, bob, expire_time, veboost_delegation, cancel_time):
    token = veboost_delegation.get_token_id(alice, 0)
    with brownie.reverts(dev_revert_msg="dev: only delegator or operator"):
        veboost_delegation.extend_boost(token, 7_500, expire_time + 1, cancel_time + 1, {"from": bob})


@pytest.mark.parametrize(
    "pct,msg",
    [
        (0, "dev: percentage must be greater than 0 bps"),
        (10_001, "dev: percentage must be less than 10_000 bps"),
    ],
)
def test_invalid_percentage(alice, expire_time, pct, msg, veboost_delegation, cancel_time):
    token = veboost_delegation.get_token_id(alice, 0)
    with brownie.reverts(msg):
        veboost_delegation.extend_boost(token, pct, expire_time + 1, cancel_time + 1, {"from": alice})


def test_new_cancel_time_must_be_less_than_new_expiry(alice, expire_time, veboost_delegation):
    token = veboost_delegation.get_token_id(alice, 0)
    with brownie.reverts(dev_revert_msg="dev: cancel time is after expiry"):
        veboost_delegation.extend_boost(token, 7_000, expire_time, expire_time + 1, {"from": alice})


def test_new_expiry_must_be_greater_than_min_delegation(alice, chain, veboost_delegation):
    token = veboost_delegation.get_token_id(alice, 0)
    with brownie.reverts(dev_revert_msg="dev: boost duration must be atleast one day"):
        veboost_delegation.extend_boost(token, 7_000, chain.time(), 0, {"from": alice})


def test_new_expiry_must_be_less_than_lock_expiry(alice, alice_unlock_time, cancel_time, veboost_delegation):
    token = veboost_delegation.get_token_id(alice, 0)
    with brownie.reverts(dev_revert_msg="dev: boost expiration is past voting escrow lock expiry"):
        veboost_delegation.extend_boost(
            token, 7_000, alice_unlock_time + 2 * WEEK, cancel_time, {"from": alice}
        )


def test_expiry_must_be_greater_than_tokens_current_expiry(
    alice, expire_time, cancel_time, veboost_delegation
):
    token = veboost_delegation.get_token_id(alice, 0)
    with brownie.reverts(
        dev_revert_msg="dev: new expiration must be greater than old token expiry"
    ):
        veboost_delegation.extend_boost(token, 7_000, expire_time - 1, cancel_time, {"from": alice})


def test_decreasing_cancel_time_on_active_token_disallowed(
    alice, chain, expire_time, cancel_time, veboost_delegation
):
    token = veboost_delegation.get_token_id(alice, 0)
    with brownie.reverts(dev_revert_msg="dev: cancel time reduction disallowed"):
        veboost_delegation.extend_boost(token, 7_000, expire_time, cancel_time - 1, {"from": alice})

    chain.mine(timestamp=expire_time)
    veboost_delegation.extend_boost(token, 7_000, chain.time() + WEEK, cancel_time - 1, {"from": alice})


def test_outstanding_negative_boosts_prevent_extending_boosts(
    alice, charlie, chain, expire_time, cancel_time, veboost_delegation
):
    # give charlie our remaining boost
    veboost_delegation.create_boost(alice, charlie, 10_000, 0, expire_time - WEEK, 1, {"from": alice})
    # fast forward to a day the boost given to charlie has expired
    chain.mine(timestamp=expire_time - WEEK + 1)

    with brownie.reverts(dev_revert_msg="dev: negative outstanding boosts"):
        veboost_delegation.extend_boost(
            veboost_delegation.get_token_id(alice, 0), 7_000, expire_time + WEEK, cancel_time, {"from": alice}
        )


def test_extension_cannot_result_in_a_lesser_value(alice, expire_time, cancel_time, veboost_delegation):
    token = veboost_delegation.get_token_id(alice, 0)
    with brownie.reverts(dev_revert_msg="dev: cannot reduce value of boost"):
        veboost_delegation.extend_boost(token, 2_000, expire_time, cancel_time, {"from": alice})


def test_slope_cannot_equal_zero(alice, charlie, chain, token, voting_escrow, veboost_delegation):
    # slope can be equal to 0 due to integer division, as the
    # amount of boost we are delegating is divided by the length of the
    # boost period, in which case if abs(y) < boost period, the slope will be 0
    amount = (DAY * 365 * 4 // WEEK) * WEEK  # very small amount
    unlock_time = ((chain.time() + amount) // WEEK) * WEEK
    token.mint(alice, amount * 10, {"from": alice})
    token.transfer(charlie, amount * 10, {"from": alice})
    token.approve(voting_escrow, amount * 10, {"from": charlie})
    voting_escrow.create_lock(amount * 10, unlock_time, {"from": charlie})
    # this should work and be okeay
    expire_time = ((chain.time() + WEEK) // WEEK) * WEEK + WEEK
    veboost_delegation.create_boost(
        charlie,
        alice,
        10_000,
        0,
        expire_time,
        0,
        {"from": charlie},
    )

    # fast forward to when we have very little boost left
    chain.mine(timestamp=unlock_time - (2 * WEEK))
    with brownie.reverts(dev_revert_msg="dev: invalid slope"):
        veboost_delegation.extend_boost(veboost_delegation.get_token_id(charlie, 0), 1, unlock_time, 0, {"from": charlie})


def test_cannot_extend_non_existent_boost(alice, veboost_delegation):
    token = veboost_delegation.get_token_id(alice, 10)
    with brownie.reverts(dev_revert_msg="dev: boost token does not exist"):
        veboost_delegation.extend_boost(token, 1, 0, 0, {"from": alice})
