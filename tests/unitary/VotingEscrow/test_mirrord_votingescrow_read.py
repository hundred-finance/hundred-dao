import brownie

YEAR = 86400 * 365

def test_nearest_locked__end(mirrored_voting_escrow, chain, accounts):
    mirrored_voting_escrow.set_mirror_whitelist(accounts[0], True, {"from": accounts[0]})

    lock_amount = 10 ** 24
    lock_end = chain.time() + YEAR

    mirrored_voting_escrow.mirror_lock(accounts[0], 250, lock_amount, lock_end, {"from": accounts[0]})
    mirrored_voting_escrow.mirror_lock(accounts[0], 1, lock_amount, lock_end + YEAR, {"from": accounts[0]})

    assert lock_end == mirrored_voting_escrow.nearest_locked__end(accounts[0])