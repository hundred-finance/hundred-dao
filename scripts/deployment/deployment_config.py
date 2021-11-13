"""
Deployment Configuration file
=============================
This script holds customizeable / sensetive values related to the DAO deployment scripts.
See `README.md` in this directory for more information on how deployment works.
"""

from brownie import rpc, web3, accounts
from web3 import middleware
from web3.gas_strategies.time_based import fast_gas_price_strategy as gas_strategy

DAY = 86400
WEEK = DAY * 7
YEAR = DAY * 365

def kovan_config():
    deployment_json="kovan_deployments.json"
    required_confirmaions=3
    hundred_token="0x10010054c81c8c01951E6A631dD228bB02d8D1e5"
    reward_epoch_length=WEEK
    gauge_types=[
        ("Liquidity", 10 ** 18),
    ]
    pool_tokens={
        "hETH": ("0xfcd8570ad81e6c77b8d252bebeba62ed980bd64d", 1)
    }
    admin=accounts.load("dev_kovan")
    rewards=[0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

    return admin, deployment_json, required_confirmaions, hundred_token, reward_epoch_length, gauge_types, pool_tokens, rewards


if not rpc.is_active():
    # logic that only executes in a live environment
    web3.eth.setGasPriceStrategy(gas_strategy)
    web3.middleware_onion.add(middleware.time_based_cache_middleware)
    web3.middleware_onion.add(middleware.latest_block_based_cache_middleware)
    web3.middleware_onion.add(middleware.simple_cache_middleware)
