import { Address, toNano, beginCell } from '@ton/core';
import { AirDrop, Claim } from '../build/claim2/tact_AirDrop';
import { NetworkProvider } from '@ton/blueprint';
// import { mnemonicToWalletKey, mnemonicNew, sign, KeyPair } from 'ton-crypto';
import * as dotenv from 'dotenv';
dotenv.config();

const actionList = ['deploy', 'push', 'test', 'claim a coins', 'Claim'];

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();
    const v = await ui.choose('await a choose:', actionList, (v) => v.toString());
    await choice(v, provider);
}

async function choice(v: string, provider: NetworkProvider) {
    if (v === 'deploy') {
        await deploy(provider);
    } else if (v === 'Claim') {
        await claimCoin(provider);
    } else if (v === 'claim a coins') {
        await opStr(provider, v, '0.15');
    } else if (v === 'push') {
        await opStr(provider, v, '1');
    } else if (v === 'test') {
        await opStr(provider, v, '0.05');   
    }
}
async function opStr(provider: NetworkProvider, op: 'push'| 'claim a coins' | 'claim' | 'test', value: string) {
    const deployer = provider.sender().address as Address;
    const claim = provider.open(await AirDrop.fromInit(deployer));

    await claim.send(
        provider.sender(),
        {
            value: toNano(value),
        },
        op
    );

    await provider.waitForDeploy(claim.address);
    console.log(claim.address);
}


async function claimCoin(provider: NetworkProvider) {
    const deployer = provider.sender().address as Address;
    const claim = provider.open(await AirDrop.fromInit(deployer));

    const prams: Claim = {
        $$type: 'Claim',
        amount: toNano('1'),
        receiver: deployer,
    }

    await claim.send(
        provider.sender(),
        {
            value: toNano('0.05'),
            bounce: false,
        },
        {
            $$type: 'Claim',
            amount: prams.amount,
            receiver: prams.receiver,
        }
    );
}

async function deploy(provider: NetworkProvider) {
    const deployer = provider.sender().address as Address;
    const claim = provider.open(await AirDrop.fromInit(deployer));

    await claim.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(claim.address);
    console.log(claim.address);
}