import brownie
import pytest

pytestmark = pytest.mark.usefixtures("boost_bob")


@pytest.mark.parametrize("use_operator", [False, True])
def test_burning_token(alice, bob, charlie, veboost_delegation, use_operator):
    caller = bob
    if use_operator:
        veboost_delegation.setApprovalForAll(charlie, True, {"from": bob})
        caller = charlie

    token_id = veboost_delegation.get_token_id(alice, 0)
    veboost_delegation.burn(token_id, {"from": caller})
    assert veboost_delegation.token_boost(token_id) == 0


@pytest.mark.parametrize("idx", [0] + list(range(2, 5)))
def test_third_party_cannot_burn_token(alice, accounts, veboost_delegation, idx):
    token_id = veboost_delegation.get_token_id(alice, 0)
    with brownie.reverts(dev_revert_msg="dev: neither owner nor approved"):
        veboost_delegation.burn(token_id, {"from": accounts[idx]})


def test_delegator_can_remint_token_id(alice, bob, cancel_time, expire_time, veboost_delegation):
    token_id = veboost_delegation.get_token_id(alice, 0)
    veboost_delegation.burn(token_id, {"from": bob})

    veboost_delegation.create_boost(alice, bob, 10_000, cancel_time, expire_time, 0, {"from": alice})

    assert veboost_delegation.token_boost(token_id) > 0


def test_burn_a_boost_updates_delegator_enumeration(alice, bob, veboost_delegation):
    token_id = veboost_delegation.get_token_id(alice, 0)
    veboost_delegation.burn(token_id, {"from": bob})

    assert veboost_delegation.total_minted(alice) == 0
    assert veboost_delegation.token_of_delegator_by_index(alice, 0) == 0
