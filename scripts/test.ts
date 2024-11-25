import { Address, toNano, beginCell } from '@ton/core';
import { AirDrop, Claim } from '../build/claim2/tact_AirDrop';
import { NetworkProvider } from '@ton/blueprint';
// import { mnemonicToWalletKey, mnemonicNew, sign, KeyPair } from 'ton-crypto';
import * as dotenv from 'dotenv';
dotenv.config();

export async function run(provider: NetworkProvider) {
    const contract = Address.parse("kQBmjR4msp7zohYfQImjwshQriG8tq3IqmwfZ4Hw5SW9q2hF");
    const claim = provider.open(await AirDrop.fromAddress(contract));

    await claim.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        "test"
    );

    await provider.waitForDeploy(claim.address);
    console.log(claim.address);
}
