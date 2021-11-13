import pytest
import logging
from brownie import (
    compile_source,
    convert,
)
from brownie_tokens import ERC20

YEAR = 365 * 86400
INITIAL_RATE = 274_815_283
YEAR_1_SUPPLY = INITIAL_RATE * 10 ** 18 // YEAR * YEAR
INITIAL_SUPPLY = 1_303_030_303


def approx(a, b, precision=1e-10):
    if a == b == 0:
        return True
    return 2 * abs(a - b) / (a + b) <= precision


def pack_values(values):
    packed = b"".join(i.to_bytes(1, "big") for i in values)
    padded = packed + bytes(32 - len(values))
    return padded


@pytest.fixture(autouse=True)
def isolation_setup(fn_isolation):
    pass


# helper functions as fixtures


@pytest.fixture(scope="module")
def theoretical_supply(chain, token):
    def _fn():
        epoch = token.mining_epoch()
        q = 1 / 2 ** 0.25
        S = INITIAL_SUPPLY * 10 ** 18
        if epoch > 0:
            S += int(YEAR_1_SUPPLY * (1 - q ** epoch) / (1 - q))
        S += int(YEAR_1_SUPPLY // YEAR * q ** epoch) * (
            chain[-1].timestamp - token.start_epoch_time()
        )
        return S

    yield _fn


# account aliases


@pytest.fixture(scope="session")
def alice(accounts):
    yield accounts[0]


@pytest.fixture(scope="session")
def bob(accounts):
    yield accounts[1]


@pytest.fixture(scope="session")
def charlie(accounts):
    yield accounts[2]


@pytest.fixture(scope="session")
def receiver(accounts):
    yield accounts.at("0x0000000000000000000000000000000000031337", True)


# core contracts


@pytest.fixture(scope="module")
def token(ERC20TOKEN, accounts):
    yield ERC20TOKEN.deploy("Test Token", "TTT", 18, 0, {"from": accounts[0]})


@pytest.fixture(scope="module")
def voting_escrow(VotingEscrow, accounts, token):
    yield VotingEscrow.deploy(
        token, "Voting-escrowed CRV", "veCRV", "veCRV_0.99", {"from": accounts[0]}
    )


@pytest.fixture(scope="module")
def gauge_controller(GaugeController, accounts, token, voting_escrow):
    yield GaugeController.deploy(token, voting_escrow, {"from": accounts[0]})

@pytest.fixture(scope="module")
def minter(Minter, Treasury, token, accounts, gauge_controller):
    treasury = Treasury.deploy(token, {"from": accounts[0]})
    token.mint(treasury, 100_000_000 * 10 ** 18, {"from": accounts[0]})

    minter = Minter.deploy(treasury, gauge_controller, {"from": accounts[0]})
    treasury.set_minter(minter)

    yield minter


@pytest.fixture(scope="module")
def reward_policy_maker(RewardPolicyMaker, accounts, alice, chain):
    reward = 100 * 10 ** 18
    contract = RewardPolicyMaker.deploy(604800, chain.time() + 604800, {"from": accounts[0]})
    contract.set_rewards_starting_at(0, [reward, reward, reward, reward, reward, reward, reward, reward, reward, reward])
    yield contract


@pytest.fixture(scope="module")
def gauge_proxy(GaugeProxy, alice, bob):
    yield GaugeProxy.deploy(alice, bob, {"from": alice})


@pytest.fixture(scope="module")
def coin_reward():
    yield ERC20("YFIIIIII Funance", "YFIIIIII", 18)


@pytest.fixture(scope="module")
def reward_contract(CurveRewards, mock_lp_token, accounts, coin_reward):
    contract = CurveRewards.deploy(mock_lp_token, coin_reward, {"from": accounts[0]})
    contract.setRewardDistribution(accounts[0], {"from": accounts[0]})
    yield contract


@pytest.fixture(scope="module")
def gauge_v4(LiquidityGaugeV4, alice, mock_lp_token, minter, reward_policy_maker):
    yield LiquidityGaugeV4.deploy(mock_lp_token, minter, alice, reward_policy_maker,{"from": alice})


@pytest.fixture(scope="module")
def rewards_only_gauge(RewardsOnlyGauge, alice, mock_lp_token):
    yield RewardsOnlyGauge.deploy(alice, mock_lp_token, {"from": alice})


@pytest.fixture(scope="module")
def three_gauges(LiquidityGaugeV4, reward_policy_maker, accounts, mock_lp_token, minter):
    contracts = [
        LiquidityGaugeV4.deploy(mock_lp_token, minter, accounts[0], reward_policy_maker, {"from": accounts[0]})
        for _ in range(3)
    ]

    yield contracts


# VestingEscrow fixtures


@pytest.fixture(scope="module")
def start_time(chain):
    yield chain.time() + 1000 + 86400 * 365


@pytest.fixture(scope="module")
def end_time(start_time):
    yield start_time + 100000000


@pytest.fixture(scope="module")
def vesting(VestingEscrow, accounts, coin_a, start_time, end_time):
    contract = VestingEscrow.deploy(
        coin_a, start_time, end_time, True, accounts[1:5], {"from": accounts[0]}
    )
    coin_a._mint_for_testing(accounts[0], 10 ** 21)
    coin_a.approve(contract, 10 ** 21, {"from": accounts[0]})
    yield contract


@pytest.fixture(scope="module")
def vesting_target(VestingEscrowSimple, accounts):
    yield VestingEscrowSimple.deploy({"from": accounts[0]})


@pytest.fixture(scope="module")
def vesting_factory(VestingEscrowFactory, accounts, vesting_target):
    yield VestingEscrowFactory.deploy(vesting_target, accounts[0], {"from": accounts[0]})


@pytest.fixture(scope="module")
def vesting_simple(VestingEscrowSimple, accounts, vesting_factory, coin_a, start_time):
    coin_a._mint_for_testing(vesting_factory, 10 ** 21)
    tx = vesting_factory.deploy_vesting_contract(
        coin_a,
        accounts[1],
        10 ** 20,
        True,
        100000000,
        start_time,
        {"from": accounts[0]},
    )
    yield VestingEscrowSimple.at(tx.new_contracts[0])


# testing contracts


@pytest.fixture(scope="module")
def coin_a():
    yield ERC20("Coin A", "USDA", 18)


@pytest.fixture(scope="module")
def coin_b():
    yield ERC20("Coin B", "USDB", 18)


@pytest.fixture(scope="module")
def coin_c():
    yield ERC20("Coin C", "mWBTC", 8)


@pytest.fixture(scope="module")
def mock_lp_token(ERC20LP, accounts):  # Not using the actual Curve contract
    yield ERC20LP.deploy("Curve LP token", "usdCrv", 18, 10 ** 9, {"from": accounts[0]})


@pytest.fixture(scope="module")
def crypto_coins(coin_a, coin_b, coin_c):
    return [coin_a, coin_b, coin_c]


@pytest.fixture(scope="session")
def crypto_project(pm):
    return pm("curvefi/curve-crypto-contract@1.0.0")


@pytest.fixture(scope="module")
def crypto_lp_token(alice, crypto_project):
    return crypto_project.CurveTokenV4.deploy("Mock Crypto LP Token", "crvMock", {"from": alice})


@pytest.fixture(scope="module")
def crypto_math(alice, crypto_project):
    return crypto_project.CurveCryptoMath3.deploy({"from": alice})


@pytest.fixture(scope="module")
def crypto_views(alice, crypto_project, crypto_math, crypto_coins):
    source: str = crypto_project.CurveCryptoViews3._build["source"]
    for idx, coin in enumerate(crypto_coins):
        new_value = 10 ** (18 - coin.decimals())
        source = source.replace(f"1,#{idx}", f"{new_value},")
    Views = compile_source(source, vyper_version="0.2.12").Vyper
    return Views.deploy(crypto_math, {"from": alice})


@pytest.fixture(scope="session")
def crypto_initial_prices():
    # p = requests.get(
    #     "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd"
    # ).json()
    # return tuple(int(p[cur]["usd"] * 1e18) for cur in ["bitcoin", "ethereum"])
    return (39362000000000003670016, 2493090000000000196608)
