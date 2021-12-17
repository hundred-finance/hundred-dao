import brownie


def test_add_to_whitelist_admin_only(smart_wallet_checker, accounts):
    with brownie.reverts("dev: admin only"):
        smart_wallet_checker.add_to_whitelist(accounts[1], {"from": accounts[1]})


def test_revoke_from_whitelist_admin_only(smart_wallet_checker, accounts):
    with brownie.reverts("dev: admin only"):
        smart_wallet_checker.revoke_from_whitelist(accounts[1], {"from": accounts[1]})


def test_set_admin_admin_only(smart_wallet_checker, accounts):
    with brownie.reverts("dev: admin only"):
        smart_wallet_checker.set_admin(accounts[1], {"from": accounts[1]})


def test_check_on_not_whitelisted(smart_wallet_checker, accounts):
    assert smart_wallet_checker.check(accounts[1]) == False


def test_check_on_whitelisted(smart_wallet_checker, accounts):
    smart_wallet_checker.add_to_whitelist(accounts[1], {"from": accounts[0]})

    assert smart_wallet_checker.check(accounts[1]) == True