import pytest


def test_update_total_supply(alice, veboost_delegation):
    veboost_delegation._mint_for_testing(alice, 0)

    assert veboost_delegation.totalSupply() == 1


@pytest.mark.usefixtures("lock_alice")
def test_update_global_enumeration(alice, chain, veboost_delegation):
    expiry = chain.time() + 86400 * 31
    veboost_delegation.create_boost(alice, alice, 10_000, 0, expiry, 0)

    assert veboost_delegation.tokenByIndex(0) == veboost_delegation.get_token_id(alice, 0)


@pytest.mark.usefixtures("lock_alice")
def test_update_owner_enumeration(alice, bob, chain, veboost_delegation):
    expiry = chain.time() + 86400 * 31
    veboost_delegation.create_boost(alice, bob, 10_000, 0, expiry, 0)

    assert veboost_delegation.tokenOfOwnerByIndex(bob, 0) == veboost_delegation.get_token_id(alice, 0)
