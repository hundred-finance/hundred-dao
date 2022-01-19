def test_set_account_operator(alice, bob, veboost_delegation):
    veboost_delegation.setApprovalForAll(bob, True, {"from": alice})

    assert veboost_delegation.isApprovedForAll(alice, bob) is True


def test_revoke_operator(alice, bob, veboost_delegation):
    veboost_delegation.setApprovalForAll(bob, True, {"from": alice})
    veboost_delegation.setApprovalForAll(bob, False, {"from": alice})

    assert veboost_delegation.isApprovedForAll(alice, bob) is False


def test_set_multiple_operators(alice, bob, charlie, dave, veboost_delegation):
    operators = [bob, charlie, dave]
    for operator in operators:
        veboost_delegation.setApprovalForAll(operator, True, {"from": alice})

    assert all(veboost_delegation.isApprovedForAll(alice, operator) for operator in operators)


def test_approval_for_all_event_fired(alice, bob, veboost_delegation):
    tx = veboost_delegation.setApprovalForAll(bob, True, {"from": alice})

    assert "ApprovalForAll" in tx.events
    assert tx.events["ApprovalForAll"] == dict(_owner=alice, _operator=bob, _approved=True)
