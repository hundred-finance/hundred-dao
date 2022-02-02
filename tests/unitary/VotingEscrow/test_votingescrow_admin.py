import brownie

YEAR = 86400 * 365
WEEK = 86400 * 7

def test_commit_admin_only(voting_escrow, accounts):
    with brownie.reverts("dev: admin only"):
        voting_escrow.commit_transfer_ownership(accounts[1], {"from": accounts[1]})


def test_apply_admin_only(voting_escrow, accounts):
    with brownie.reverts("dev: admin only"):
        voting_escrow.apply_transfer_ownership({"from": accounts[1]})


def test_commit_transfer_ownership(voting_escrow, accounts):
    voting_escrow.commit_transfer_ownership(accounts[1], {"from": accounts[0]})

    assert voting_escrow.admin() == accounts[0]
    assert voting_escrow.future_admin() == accounts[1]


def test_apply_transfer_ownership(voting_escrow, accounts):
    voting_escrow.commit_transfer_ownership(accounts[1], {"from": accounts[0]})
    voting_escrow.apply_transfer_ownership({"from": accounts[0]})

    assert voting_escrow.admin() == accounts[1]


def test_apply_without_commit(voting_escrow, accounts):
    with brownie.reverts("dev: admin not set"):
        voting_escrow.apply_transfer_ownership({"from": accounts[0]})


def test_create_lock_for_another_wallet(voting_escrow, chain, accounts):
    with brownie.reverts("Lock creator not allowed"):
        voting_escrow.create_lock_for(accounts[1], 10 ** 24, chain.time() + YEAR, {"from": accounts[0]})


def test_admin_create_lock_for_another_wallet(voting_escrow, smart_wallet_checker, token, chain, accounts):
    smart_wallet_checker.add_to_whitelist(accounts[0], {"from": accounts[0]})

    voting_escrow.commit_lock_creator(smart_wallet_checker)
    voting_escrow.apply_lock_creator()

    token.mint(accounts[0], 10 ** 24)
    token.approve(voting_escrow, 10 ** 24, {"from": accounts[0]})

    lock_amount = 10 ** 24
    lock_end = chain.time() + YEAR

    voting_escrow.create_lock_for(accounts[1], lock_amount, lock_end, {"from": accounts[0]})

    assert (lock_amount, int(lock_end / WEEK) * WEEK) == voting_escrow.locked(accounts[1])