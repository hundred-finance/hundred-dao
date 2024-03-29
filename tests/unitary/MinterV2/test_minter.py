import itertools

import brownie
import pytest

TYPE_WEIGHTS = [5e17, 1e19]
GAUGE_WEIGHTS = [1e19, 1e18, 5e17]
GAUGE_TYPES = [0, 0, 1]

MONTH = 86400 * 30
WEEK = 7 * 86400


@pytest.fixture(scope="module", autouse=True)
def minter_setup(accounts, mock_lp_token, gauge_controller, three_gauges, chain):

    # ensure the tests all begin at the start of the epoch week
    chain.mine(timestamp=(chain.time() / WEEK + 1) * WEEK)

    # set types
    for weight in TYPE_WEIGHTS:
        gauge_controller.add_type(b"Liquidity", weight, {"from": accounts[0]})

    # add gauges
    for i in range(3):
        gauge_controller.add_gauge(
            three_gauges[i], GAUGE_TYPES[i], GAUGE_WEIGHTS[i], {"from": accounts[0]}
        )

    # transfer tokens
    for acct in accounts[1:4]:
        mock_lp_token.transfer(acct, 1e18, {"from": accounts[0]})

    # approve gauges
    for gauge, acct in itertools.product(three_gauges, accounts[1:4]):
        mock_lp_token.approve(gauge, 1e18, {"from": acct})


def test_mint(accounts, chain, three_gauges, minter, token):
    three_gauges[0].deposit(1e18, {"from": accounts[1]})

    chain.sleep(MONTH)
    minter.mint(three_gauges[0], {"from": accounts[1]})
    expected = three_gauges[0].integrate_fraction(token, accounts[1])

    assert expected > 0
    assert token.balanceOf(accounts[1]) == expected
    assert minter.minted(accounts[1], three_gauges[0], token) == expected


def test_mint_immediate(accounts, chain, three_gauges, minter, token):
    three_gauges[0].deposit(1e18, {"from": accounts[1]})
    t0 = chain.time()
    chain.sleep((t0 + WEEK) // WEEK * WEEK - t0 + 1)  # 1 second more than enacting the weights

    minter.mint(three_gauges[0], {"from": accounts[1]})
    balance = token.balanceOf(accounts[1])

    assert balance > 0
    assert minter.minted(accounts[1], three_gauges[0], token) == balance


def test_mint_multiple_same_gauge(accounts, chain, three_gauges, minter, token):
    three_gauges[0].deposit(1e18, {"from": accounts[1]})

    chain.sleep(MONTH)
    minter.mint(three_gauges[0], {"from": accounts[1]})
    balance = token.balanceOf(accounts[1])

    chain.sleep(MONTH)
    minter.mint(three_gauges[0], {"from": accounts[1]})
    expected = three_gauges[0].integrate_fraction(token, accounts[1])
    final_balance = token.balanceOf(accounts[1])

    assert final_balance > balance
    assert final_balance == expected
    assert minter.minted(accounts[1], three_gauges[0], token) == expected


def test_mint_multiple_gauges(accounts, chain, three_gauges, minter, token):
    for i in range(3):
        three_gauges[i].deposit((i + 1) * 10 ** 17, {"from": accounts[1]})

    chain.sleep(MONTH)

    for i in range(3):
        minter.mint(three_gauges[i], {"from": accounts[1]})

    total_minted = 0
    for i in range(3):
        gauge = three_gauges[i]
        minted = minter.minted(accounts[1], gauge, token)
        assert minted == gauge.integrate_fraction(token, accounts[1])
        total_minted += minted

    assert token.balanceOf(accounts[1]) == total_minted


def test_mint_after_withdraw(accounts, chain, three_gauges, minter, token):
    three_gauges[0].deposit(1e18, {"from": accounts[1]})

    chain.sleep(2 * WEEK)
    three_gauges[0].withdraw(1e18, {"from": accounts[1]})
    minter.mint(three_gauges[0], {"from": accounts[1]})

    assert token.balanceOf(accounts[1]) > 0


def test_mint_multiple_after_withdraw(accounts, chain, three_gauges, minter, token):
    three_gauges[0].deposit(1e18, {"from": accounts[1]})

    chain.sleep(10)
    three_gauges[0].withdraw(1e18, {"from": accounts[1]})
    minter.mint(three_gauges[0], {"from": accounts[1]})
    balance = token.balanceOf(accounts[1])

    chain.sleep(10)
    minter.mint(three_gauges[0], {"from": accounts[1]})

    assert token.balanceOf(accounts[1]) == balance


def test_no_deposit(accounts, chain, three_gauges, minter, token):
    minter.mint(three_gauges[0], {"from": accounts[1]})

    assert token.balanceOf(accounts[1]) == 0
    assert minter.minted(accounts[1], three_gauges[0], token) == 0


def test_mint_wrong_gauge(accounts, chain, three_gauges, minter, token):
    three_gauges[0].deposit(1e18, {"from": accounts[1]})

    chain.sleep(MONTH)
    minter.mint(three_gauges[1], {"from": accounts[1]})

    assert token.balanceOf(accounts[1]) == 0
    assert minter.minted(accounts[1], three_gauges[0], token) == 0
    assert minter.minted(accounts[1], three_gauges[1], token) == 0


def test_mint_not_a_gauge(accounts, minter, token):
    with brownie.reverts("dev: gauge is not added"):
        minter.mint(accounts[1], {"from": accounts[0]})


def test_mint_before_inflation_begins(accounts, chain, three_gauges, minter, token, reward_policy_maker):
    three_gauges[0].deposit(1e18, {"from": accounts[1]})

    chain.sleep(reward_policy_maker.epoch_start_time(reward_policy_maker.epoch_at(chain.time())) - chain.time() - 5)
    minter.mint(three_gauges[0], {"from": accounts[1]})

    assert token.balanceOf(accounts[1]) == 0
    assert minter.minted(accounts[1], three_gauges[0], token) == 0


def test_mint_with_two_reward_tokens(accounts, chain, three_gauges, minter, token, token2, reward_policy_maker, treasury):
    reward = 10 * 10 ** 18

    minter.add_token(token2)
    token2.mint(treasury, 100_000_000 * 10 ** 18, {"from": accounts[0]})
    reward_policy_maker.set_rewards_starting_at(
        reward_policy_maker.current_epoch() + 1,
        token2,
        [reward, reward, reward, reward, reward, reward, reward, reward, reward, reward]
    )

    three_gauges[0].deposit(1e18, {"from": accounts[1]})

    t0 = chain.time()
    chain.sleep((t0 + WEEK) // WEEK * WEEK - t0 + 1)  # 1 second more than enacting the weights

    minter.mint(three_gauges[0], {"from": accounts[1]})
    balance = token.balanceOf(accounts[1])
    balance2 = token2.balanceOf(accounts[1])

    assert balance > 0
    assert balance2 > 0
    assert balance2 == balance / 10
    assert minter.minted(accounts[1], three_gauges[0], token) == balance
    assert minter.minted(accounts[1], three_gauges[0], token2) == balance2


