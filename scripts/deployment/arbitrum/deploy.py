from .. import deployment_config as config
from .. import deploy as deploy_lib

def main():
    admin, deployment_json, required_confirmaions, hundred_token, reward_epoch_length, gauge_types, pool_tokens = config.arbitrum_config()

    deploy_lib.deploy(
        admin,
        hundred_token,
        required_confirmaions, 
        deployment_json,
        gauge_types,
        pool_tokens,
        reward_epoch_length
    )