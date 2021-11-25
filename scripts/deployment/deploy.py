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
    Contract
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


def deploy_gauge(
        admin,
        deployments_json,
        lp_token,
        lp_name,
        weight=1,
        confs=1
):
    prev_deployment = []
    with open(deployments_json, 'r') as fp:
        prev_deployment = json.load(fp)

    reward_policy_maker = prev_deployment["RewardPolicyMaker"]
    minter = prev_deployment["Minter"]
    gauge_controller = Contract.from_explorer(prev_deployment["GaugeController"])

    gauge = LiquidityGaugeV4.deploy(
        lp_token, minter, admin, reward_policy_maker,
        {"from": admin, "required_confs": confs}
    )

    gauge_controller.add_gauge(gauge, 0, weight, {"from": admin, "required_confs": confs})
    prev_deployment["LiquidityGaugeV4"][lp_name] = gauge.address

    with open(deployments_json, 'w') as fp:
        json.dump(prev_deployment, fp)

    print(f"Deployment addresses saved to {deployments_json}")


def transfer_ownership(deployments_json, admin, confs, new_admin):
    deployment = []
    with open(deployments_json, 'r') as fp:
        deployment = json.load(fp)

    gauge_controller = Contract.from_explorer(deployment["GaugeController"])
    voting_escrow = Contract.from_explorer(deployment["VotingEscrow"])
    reward_policy_maker = Contract.from_explorer(deployment["RewardPolicyMaker"])
    treasury = Contract.from_explorer(deployment["Treasury"])

    gauge_controller.commit_transfer_ownership(new_admin, {"from": admin, "required_confs": confs})
    gauge_controller.apply_transfer_ownership({"from": admin, "required_confs": confs})

    voting_escrow.commit_transfer_ownership(new_admin, {"from": admin, "required_confs": confs})
    voting_escrow.apply_transfer_ownership({"from": admin, "required_confs": confs})

    reward_policy_maker.set_admin(new_admin, {"from": admin, "required_confs": confs})

    treasury.set_admin(new_admin, {"from": admin, "required_confs": confs})

    for name, address in deployment['LiquidityGaugeV4'].items():
        gauge = Contract.from_explorer(address)
        gauge.commit_transfer_ownership(new_admin, {"from": admin, "required_confs": confs})


def accept_ownership(deployments_json, admin, confs):
    deployment = []
    with open(deployments_json, 'r') as fp:
        deployment = json.load(fp)

    for name, address in deployment['LiquidityGaugeV4'].items():
        gauge = Contract.from_explorer(address)
        gauge.accept_transfer_ownership({"from": admin, "required_confs": confs})