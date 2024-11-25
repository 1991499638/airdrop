import { Address, toNano, beginCell } from '@ton/core';
import { AirDrop, Claim } from '../build/Claim/tact_AirDrop';
import { NetworkProvider } from '@ton/blueprint';
import { mnemonicToWalletKey, mnemonicNew, sign, KeyPair } from 'ton-crypto';
import * as dotenv from 'dotenv';
dotenv.config();

const actionList = ['deploy', 'claim a coin'];

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();
    const v = await ui.choose('await a choose:', actionList, (v) => v.toString());
    await choice(v, provider);
}

async function choice(v: string, provider: NetworkProvider) {
    if (v === 'deploy') {
        await deploy(provider);
    } else if (v === 'claim a coin') {
        await claimCoin(provider);
    }
}

async function _Signature(src: Claim){
    const signatureData = beginCell().storeAddress(src.receiver).storeCoins(src.amount).storeCoins(src.order).endCell();
    const keyPair = await toKeyPair() as KeyPair;
    const signature = sign(signatureData.hash(), keyPair.secretKey);
    return beginCell().storeBuffer(signature).endCell();
}

async function toKeyPair(): Promise<bigint | KeyPair> {
    let publicKeyBigInt;
    if (!process.env.MNEMONIC) {
        publicKeyBigInt = BigInt(`0xce687256bd2f368fd7bf548ad6f1204e193063545c72862454ad479a1798ea40`);
        return publicKeyBigInt;
    } else {
        const mnemonicArray = process.env.MNEMONIC.split(' ');
        const keyPair = await mnemonicToWalletKey(mnemonicArray);
        return keyPair;
    }
}

function keyPairToBigInt(keyPair: KeyPair): bigint {
    return BigInt(`0x${keyPair.publicKey.toString('hex')}`);
}

async function claimCoin(provider: NetworkProvider) {
    const deployer = provider.sender().address as Address;
    const claim = provider.open(await AirDrop.fromInit(deployer));

    const prams: Claim = {
        $$type: 'Claim',
        order: 0n,
        amount: 10n,
        receiver: deployer,
        signature: beginCell().endCell().asSlice(),
    }
    const _signature = await _Signature(prams);

    await claim.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Claim',
            order: prams.order,
            amount: prams.amount,
            receiver: prams.receiver,
            signature: _signature.asSlice(),
        }
    );
}

async function deploy(provider: NetworkProvider) {
    // const add = Address.parse("UQBjLdAFD9XUV9ELfZAb21zxM2ADSl9oEaLY1KIaOoGqESA1");
    const deployer = provider.sender().address as Address;
    const claim = provider.open(await AirDrop.fromInit(deployer));

    let publicKeyBigInt;
    if (!process.env.MNEMONIC) {
        publicKeyBigInt = BigInt(`0xce687256bd2f368fd7bf548ad6f1204e193063545c72862454ad479a1798ea40`);
    } else {
        const mnemonicArray = process.env.MNEMONIC.split(' ');
        const keyPair = await mnemonicToWalletKey(mnemonicArray);
        publicKeyBigInt = BigInt(`0x${keyPair.publicKey.toString('hex')}`);
    }
    
    console.log('publicKeyBigInt', publicKeyBigInt);

    await claim.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
            publicKey: publicKeyBigInt
        }
    );

    await provider.waitForDeploy(claim.address);
    console.log(claim.address);
}