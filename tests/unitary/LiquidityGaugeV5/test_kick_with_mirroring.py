import brownie

MAX_UINT256 = 2 ** 256 - 1
WEEK = 7 * 86400


def test_kick(chain, accounts, gauge_v5, mirrored_voting_escrow, voting_escrow, token, mock_lp_token):
    alice, bob = accounts[:2]
    chain.sleep(2 * WEEK + 5)

    mirrored_voting_escrow.set_mirror_whitelist(accounts[0], True, {"from": accounts[0]})
    mirrored_voting_escrow.mirror_lock(alice, 250, 0, 5 * 10 ** 19, chain.time() + 4 * WEEK, {"from": accounts[0]})

    token.mint(alice, 5 * 10 ** 19)
    token.approve(voting_escrow, MAX_UINT256, {"from": alice})
    voting_escrow.create_lock(5 * 10 ** 19, chain.time() + 4 * WEEK, {"from": alice})

    mock_lp_token.approve(gauge_v5.address, MAX_UINT256, {"from": alice})
    gauge_v5.deposit(10 ** 21, {"from": alice})

    assert gauge_v5.working_balances(alice) == 10 ** 21

    chain.sleep(WEEK)

    with brownie.reverts("dev: kick not allowed"):
        gauge_v5.kick(alice, {"from": bob})

    chain.sleep(4 * WEEK)

    gauge_v5.kick(alice, {"from": bob})
    assert gauge_v5.working_balances(alice) == 4 * 10 ** 20

    with brownie.reverts("dev: kick not needed"):
        gauge_v5.kick(alice, {"from": bob})
