import json
import time

from brownie import (
    RewardPolicyMaker,
    GaugeController,
    LiquidityGaugeV4,
    Treasury,
    Minter,
    VotingEscrow,
    history,
)

def deploy(
        admin, 
        hnd_token_address,
        confs=1, 
        deployments_json=None, 
        gauge_types=None, 
        pool_tokens=None, 
        reward_epoch_length=86400 * 7
    ):
    voting_escrow = VotingEscrow.deploy(
        hnd_token_address,
        "Vote-escrowed HND",
        "veHND",
        "veHND_1.0.0",
        {"from": admin, "required_confs": confs}
    )
    treasury = Treasury.deploy(
        hnd_token_address,
        {"from": admin, "required_confs": confs}
    )
    reward_policy_maker = RewardPolicyMaker.deploy(
        reward_epoch_length,
        {"from": admin, "required_confs": confs}
    )

    gauge_controller = GaugeController.deploy(
        hnd_token_address, voting_escrow, {"from": admin, "required_confs": confs}
    )
    for name, weight in gauge_types:
        gauge_controller.add_type(name, weight, {"from": admin, "required_confs": confs})

    minter = Minter.deploy(
        treasury, gauge_controller, {"from": admin, "required_confs": confs}
    )

    treasury.set_minter(minter)

    deployments = {
        "VotingEscrow": voting_escrow.address,
        "GaugeController": gauge_controller.address,
        "Treasury": treasury.address,
        "RewardPolicyMaker": reward_policy_maker.address,
        "Minter": minter.address,
        "LiquidityGaugeV4": {}
    }
    for name, (lp_token, weight) in pool_tokens.items():
        gauge = LiquidityGaugeV4.deploy(
            lp_token, minter, admin, reward_policy_maker, 
            {"from": admin, "required_confs": confs}
        )
        gauge_controller.add_gauge(gauge, 0, weight, {"from": admin, "required_confs": confs})
        deployments["LiquidityGaugeV4"][name] = gauge.address

    print(f"Deployment complete! Total gas used: {sum(i.gas_used for i in history)}")
    if deployments_json is not None:
        with open(deployments_json, "w") as fp:
            json.dump(deployments, fp)
        print(f"Deployment addresses saved to {deployments_json}")
