from .. import deployment_config as config
from .. import deploy as deploy_lib

def main():
    admin, deployment_json, required_confirmaions, hundred_token, reward_epoch_length, gauge_types, pool_tokens = config.kovan_config()

    deploy_lib.transfer_ownership(
        deployment_json, 
        admin,
        required_confirmaions,
        "TODO-NEW-OWNER-WALLET"
    )