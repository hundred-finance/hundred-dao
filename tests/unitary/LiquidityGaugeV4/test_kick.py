import brownie

MAX_UINT256 = 2 ** 256 - 1
WEEK = 7 * 86400


def test_kick(chain, accounts, gauge_v4, voting_escrow, token, mock_lp_token):
    alice, bob = accounts[:2]
    chain.sleep(2 * WEEK + 5)

    token.mint(alice, 10 ** 24)
    token.approve(voting_escrow, MAX_UINT256, {"from": alice})
    voting_escrow.create_lock(10 ** 20, chain.time() + 4 * WEEK, {"from": alice})

    mock_lp_token.approve(gauge_v4.address, MAX_UINT256, {"from": alice})
    gauge_v4.deposit(10 ** 21, {"from": alice})

    assert gauge_v4.working_balances(alice) == 10 ** 21

    chain.sleep(WEEK)

    with brownie.reverts("dev: kick not allowed"):
        gauge_v4.kick(alice, {"from": bob})

    chain.sleep(4 * WEEK)

    gauge_v4.kick(alice, {"from": bob})
    assert gauge_v4.working_balances(alice) == 4 * 10 ** 20

    with brownie.reverts("dev: kick not needed"):
        gauge_v4.kick(alice, {"from": bob})
