
export function patchAbiGasFields(abi: any[]) {
    for(let i = 0; i < abi.length; i++) {
        abi[i].gas = undefined
    }
    return abi
}

export interface Deployment {
    Gauges: Array<{id: string, address: string}>
    VotingEscrow?: string
    VotingEscrowV1?: string
    VotingEscrowV2?: string
    GaugeController?: string
    Treasury?: string
    RewardPolicyMaker?: string
    SmartWalletChecker?: string
    Minter?: string
}

export function getChainName(id: number) {

    if (id === 10) {
        return "optimism";
    }

    if (id === 100) {
        return "gnosis";
    }

    if (id === 250) {
        return "fantom";
    }

    if (id === 42161) {
        return "arbitrum";
    }

    if (id === 1666600000) {
        return "harmony";
    }

    if (id === 1285) {
        return "moonriver";
    }

    return "ethereum";
}

export function mapToObj(m: Map<any, any>) {
    return Array.from(m).reduce((obj: any, [key, value]) => {
        obj[key] = value;
        return obj;
    }, {});
}