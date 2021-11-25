from .. import deployment_config as config
from .. import deploy as deploy_lib

def main():
    admin, deployment_json, required_confirmaions, hundred_token, reward_epoch_length, gauge_types, pool_tokens = config.kovan_config()

    deploy_lib.deploy_gauge(
        admin,
        deployment_json, 
        "0xb4300e088a3ae4e624ee5c71bc1822f68bb5f2bc",
        "hLINK",
    )