import pytest


@pytest.fixture(autouse=True)
def setup(alice, bob, veboost_delegation, alice_unlock_time, lock_alice):
    veboost_delegation.create_boost(
        alice, bob, 10_000, alice_unlock_time, alice_unlock_time, 0, {"from": alice}
    )


def test_update_total_supply(alice, veboost_delegation):
    veboost_delegation._burn_for_testing(veboost_delegation.get_token_id(alice, 0), {"from": alice})
    assert veboost_delegation.totalSupply() == 0


def test_update_global_enumeration(alice, veboost_delegation):
    veboost_delegation._burn_for_testing(veboost_delegation.get_token_id(alice, 0), {"from": alice})

    assert veboost_delegation.tokenByIndex(0) == 0


def test_update_owner_enumeration(alice, bob, veboost_delegation):
    veboost_delegation._burn_for_testing(veboost_delegation.get_token_id(alice, 0), {"from": alice})

    assert veboost_delegation.tokenOfOwnerByIndex(bob, 0) == 0
