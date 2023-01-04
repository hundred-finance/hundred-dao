import {ethers} from "hardhat";

async function fetchData(blockNumber: number, txHash: string) {
    const block = await ethers.provider.getBlock(blockNumber);
    const logs = await ethers.provider.getLogs({ blockHash: block.hash });
    console.log('block: ', block);
    for (let i = 0; i < block.transactions.length; i++) {
        const hash = block.transactions[i].toLowerCase();
        if (txHash === hash) {
            const tx = await ethers.provider.getTransaction(hash);
            if (!tx.from) {
                console.log('tx: ', tx);
            }
        }
    }
    console.log('logs: ', JSON.stringify(logs));
}

async function fetchTransactionData(hash: string) {
    const tx = await ethers.provider.getTransaction(hash);
    if (!tx.from) {
        console.log('tx: ', tx);
    }
}

async function fetchLogsData(blockNumber: number, txHash: string) {
    const block = await ethers.provider.getBlock(blockNumber);
    const logs = await ethers.provider.getLogs({ blockHash: block.hash });
    console.log('logs: ', JSON.stringify(logs.filter(l => l.transactionHash === txHash)));
}

fetchLogsData(43777880, "0xb38bbb39dd8b3d7f2d45ae937c4082eb44df135e856ab564563434320fd6c418");