import math

import pytest
from brownie import ZERO_ADDRESS

REWARD = 10 ** 20
WEEK = 7 * 86400


@pytest.fixture(scope="module", autouse=True)
def initial_setup(
    alice,
    chain,
    coin_reward,
    reward_contract,
    token,
    mock_lp_token,
    gauge_v4,
    gauge_controller,
    minter,
):
    # gauge setup
    gauge_controller.add_type(b"Liquidity", 10 ** 10, {"from": alice})
    gauge_controller.add_gauge(gauge_v4, 0, 0, {"from": alice})

    # deposit into gauge
    mock_lp_token.approve(gauge_v4, 2 ** 256 - 1, {"from": alice})
    gauge_v4.deposit(10 ** 18, {"from": alice})

    # add rewards
    sigs = [
        reward_contract.stake.signature[2:],
        reward_contract.withdraw.signature[2:],
        reward_contract.getReward.signature[2:],
    ]
    sigs = f"0x{sigs[0]}{sigs[1]}{sigs[2]}{'00' * 20}"

    gauge_v4.set_rewards(reward_contract, sigs, [coin_reward] + [ZERO_ADDRESS] * 7, {"from": alice})

    # fund rewards
    coin_reward._mint_for_testing(reward_contract, REWARD)
    reward_contract.notifyRewardAmount(REWARD, {"from": alice})

    # sleep half way through the reward period
    chain.sleep(int(86400 * 3.5))


def test_transfer_does_not_trigger_claim_for_sender(alice, bob, chain, gauge_v4, coin_reward):
    amount = gauge_v4.balanceOf(alice)

    gauge_v4.transfer(bob, amount, {"from": alice})

    reward = coin_reward.balanceOf(alice)
    assert reward == 0


def test_transfer_does_not_trigger_claim_for_receiver(alice, bob, chain, gauge_v4, coin_reward):
    amount = gauge_v4.balanceOf(alice) // 2

    gauge_v4.transfer(bob, amount, {"from": alice})
    chain.sleep(WEEK)
    gauge_v4.transfer(alice, amount, {"from": bob})

    for acct in (alice, bob):
        assert coin_reward.balanceOf(acct) == 0


def test_claim_rewards_stil_accurate(alice, bob, chain, gauge_v4, coin_reward):
    amount = gauge_v4.balanceOf(alice)

    gauge_v4.transfer(bob, amount, {"from": alice})

    # sleep half way through the reward period
    chain.sleep(int(86400 * 3.5))

    for acct in (alice, bob):
        gauge_v4.claim_rewards({"from": acct})

        assert math.isclose(coin_reward.balanceOf(acct), REWARD // 2, rel_tol=0.01)
