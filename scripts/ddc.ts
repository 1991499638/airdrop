import { Message } from '@ton/core';
import { beginCell, contractAddress, toNano, TonClient4, WalletContractV4, internal, fromNano } from "@ton/ton";
import { mnemonicToPrivateKey } from "ton-crypto";
import * as dotenv from "dotenv";
dotenv.config();
import { getHttpV4Endpoint } from "@orbs-network/ton-access";
import { AirDrop, Claim } from '../build/claim2/tact_AirDrop';



(async () => {
    // get the decentralized RPC endpoint
    const endpoint = await getHttpV4Endpoint({
        network: "testnet",
    });
    
    // initialize ton library
    const client4 = new TonClient4({ endpoint });

    let mnemonics = (process.env.MNEMONIC || "").toString(); // 🔴 Change to your own, by creating .env file!
    let keyPair = await mnemonicToPrivateKey(mnemonics.split(" "));
    let secretKey = keyPair.secretKey;
    let workchain = 0; //we are working in basechain.
    let deployer_wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey });
    console.log('--------------------------');

    let deployer_wallet_contract = client4.open(deployer_wallet);

    let air = await AirDrop.init(deployer_wallet_contract.address);
    let airAddress = contractAddress(workchain, air);
    let deployAmount = toNano("0.15");

    let supply = toNano(1000000000); // 🔴 Specify total supply in nano
    let message = 'test';
    // let message = 'claim a coins';
    let packed_msg = beginCell().storeUint(0, 32).storeStringTail(message).endCell();

    // send a message on new address contract to deploy it
    let seqno: number = await deployer_wallet_contract.getSeqno();
    console.log("🛠️Preparing new outgoing massage from deployment wallet. \n" + deployer_wallet_contract.address);
    console.log("Seqno: ", seqno + "\n");

    // Get deployment wallet balance
    let balance: bigint = await deployer_wallet_contract.getBalance();
    console.log("Current deployment wallet balance = ", fromNano(balance).toString(), "💎TON");


    await deployer_wallet_contract.sendTransfer({
        seqno,
        secretKey,
        messages: [
            internal({
                to: airAddress,
                value: deployAmount,
                bounce: false,
                body: packed_msg,
            }),
        ],
    });
    console.log("====== Deployment message sent to =======\n", airAddress);
})();
