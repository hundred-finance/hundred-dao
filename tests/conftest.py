import brownie
import pytest
from brownie_tokens import ERC20

DAY = 86400
WEEK = DAY * 7
YEAR = 365 * DAY
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

# constants

@pytest.fixture(scope="session")
def alice_lock_value():
    return 1_000_000 * 10 ** 18


@pytest.fixture
def alice_unlock_time(chain):
    # need to round down to weeks
    return ((chain.time() + DAY * 365 * 4) // WEEK) * WEEK


@pytest.fixture(scope="session")
def bob_lock_value():
    return 500_000 * 10 ** 18


@pytest.fixture
def bob_unlock_time(chain):
    return ((chain.time() + DAY * 365 * 2) // WEEK) * WEEK


@pytest.fixture
def expire_time(alice_unlock_time, chain):
    now = chain.time()
    return ((now + (alice_unlock_time - now) // 2) // WEEK) * WEEK


@pytest.fixture
def cancel_time(expire_time):
    return expire_time - WEEK

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
def dave(accounts):
    return accounts[3]


@pytest.fixture(scope="session")
def eve(accounts):
    return accounts[4]


@pytest.fixture(scope="session")
def receiver(accounts):
    yield accounts.at("0x0000000000000000000000000000000000031337", True)


# core contracts


@pytest.fixture(scope="module")
def token(ERC20TOKEN, accounts):
    yield ERC20TOKEN.deploy("Test Token", "TTT", 18, 0, {"from": accounts[0]})


@pytest.fixture(scope="module")
def voting_escrow(VotingEscrowV2, accounts, token):
    yield VotingEscrowV2.deploy(
        token, "Voting-escrowed HND", "veHND", "veHND_0.99", {"from": accounts[0]}
    )

@pytest.fixture(scope="module")
def mirrored_voting_escrow(MirroredVotingEscrow, accounts, voting_escrow):
    yield MirroredVotingEscrow.deploy(accounts[0], voting_escrow, "Mirrored Voting-escrowed HND", "mveHND", "mveHND_0.99", {"from": accounts[0]})


@pytest.fixture(scope="module")
def gauge_controller(GaugeControllerV2, accounts, token, mirrored_voting_escrow):
    yield GaugeControllerV2.deploy(token, mirrored_voting_escrow, {"from": accounts[0]})

@pytest.fixture(scope="module")
def minter(Minter, Treasury, token, accounts, gauge_controller):
    treasury = Treasury.deploy(token, {"from": accounts[0]})
    token.mint(treasury, 100_000_000 * 10 ** 18, {"from": accounts[0]})

    minter = Minter.deploy(treasury, gauge_controller, {"from": accounts[0]})
    treasury.set_minter(minter)

    yield minter


@pytest.fixture(scope="module")
def reward_policy_maker(RewardPolicyMaker, accounts):
    reward = 100 * 10 ** 18
    contract = RewardPolicyMaker.deploy(604800, {"from": accounts[0]})
    contract.set_rewards_starting_at(contract.current_epoch() + 1, [reward, reward, reward, reward, reward, reward, reward, reward, reward, reward])
    yield contract


@pytest.fixture(scope="module")
def coin_reward():
    yield ERC20("YFIIIIII Funance", "YFIIIIII", 18)


@pytest.fixture(scope="module")
def reward_contract(CurveRewards, mock_lp_token, accounts, coin_reward):
    contract = CurveRewards.deploy(mock_lp_token, coin_reward, {"from": accounts[0]})
    contract.setRewardDistribution(accounts[0], {"from": accounts[0]})
    yield contract


@pytest.fixture(scope="module")
def veboost_delegation(VotingEscrowDelegationV2, alice, mirrored_voting_escrow):
    yield VotingEscrowDelegationV2.deploy("Voting Escrow Boost Delegation", "veBoost", "", mirrored_voting_escrow,{"from": alice})


@pytest.fixture(scope="module")
def veboost_proxy(DelegationProxy, alice, veboost_delegation, mirrored_voting_escrow):
    yield DelegationProxy.deploy(veboost_delegation, alice, alice, mirrored_voting_escrow,{"from": alice})


@pytest.fixture(scope="module")
def gauge_v4_1(LiquidityGaugeV4_1, alice, mock_lp_token, minter, reward_policy_maker, veboost_proxy):
    yield LiquidityGaugeV4_1.deploy(mock_lp_token, minter, alice, reward_policy_maker, veboost_proxy,{"from": alice})


@pytest.fixture(scope="module")
def three_gauges(LiquidityGaugeV4_1, reward_policy_maker, accounts, mock_lp_token, minter, veboost_proxy):
    contracts = [
        LiquidityGaugeV4_1.deploy(mock_lp_token, minter, accounts[0], reward_policy_maker, veboost_proxy, {"from": accounts[0]})
        for _ in range(3)
    ]

    yield contracts


@pytest.fixture(scope="module")
def smart_wallet_checker(SmartWalletChecker, accounts):
    yield SmartWalletChecker.deploy(accounts[0], {"from": accounts[0]})


@pytest.fixture(scope="module")
def start_time(chain):
    yield chain.time() + 1000 + 86400 * 365


@pytest.fixture(scope="module")
def end_time(start_time):
    yield start_time + 100000000


# testing contracts


@pytest.fixture(scope="module")
def coin_a():
    yield ERC20("Coin A", "USDA", 18)

@pytest.fixture(scope="module")
def coin_b():
    yield ERC20("Coin B", "USDB", 18)

@pytest.fixture(scope="module")
def mock_lp_token(ERC20LP, accounts):  # Not using the actual Curve contract
    yield ERC20LP.deploy("Curve LP token", "usdCrv", 18, 10 ** 9, {"from": accounts[0]})


@pytest.fixture(scope="session", autouse=True)
def multicall(alice):
    return brownie.multicall.deploy({"from": alice})
# helper functions


@pytest.fixture
def lock_alice(alice, alice_lock_value, alice_unlock_time, token, voting_escrow):
    token.mint(alice, alice_lock_value, {"from": alice})
    token.approve(voting_escrow, alice_lock_value, {"from": alice})
    voting_escrow.create_lock(alice_lock_value, alice_unlock_time, {"from": alice})


@pytest.fixture
def lock_bob(bob, bob_lock_value, bob_unlock_time, token, voting_escrow):
    token.mint(bob, bob_lock_value, {"from": bob})
    token.approve(voting_escrow, bob_lock_value, {"from": bob})
    voting_escrow.create_lock(bob_lock_value, bob_unlock_time, {"from": bob})


@pytest.fixture
def boost_bob(alice, lock_alice, bob, expire_time, cancel_time, veboost_delegation):
    veboost_delegation.create_boost(alice, bob, 5_000, cancel_time, expire_time, 0, {"from": alice})