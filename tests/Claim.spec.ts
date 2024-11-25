import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, beginCell, Cell, fromNano } from '@ton/core';
import { AirDrop } from '../build/Claim/tact_AirDrop';
import { mnemonicToWalletKey, mnemonicNew, sign } from 'ton-crypto';
import '@ton/test-utils';

describe('AirDrop', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let airDrop: SandboxContract<AirDrop>;
    let userTom: SandboxContract<TreasuryContract>;

    //服务器测试私钥
    let mnemonic: string[];
    //部署合约
    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        userTom = await blockchain.treasury('userTom');
        airDrop = blockchain.openContract(await AirDrop.fromInit(deployer.address));

        mnemonic = await mnemonicNew();
        const keyPair = await mnemonicToWalletKey(mnemonic);
        let publicKeyBigInt = BigInt(`0x${keyPair.publicKey.toString('hex')}`);

        const deployResult = await airDrop.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
                publicKey: publicKeyBigInt
            },
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: airDrop.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy success', async () => { });
    it('should airDrop success', async () => {
        //
        let random = await blockchain.treasury('random');
        const tx = await airDrop.send(
            random.getSender(),
            {
                value: toNano('5'),
            },
            "push",
        );

        expect(tx.transactions).toHaveTransaction({
            from: random.address,
            to: airDrop.address,
            success: false,
        });
        console.log("random push Balance: ", fromNano((await blockchain.getContract(airDrop.address)).balance));

        const tx1 = await airDrop.send(
            deployer.getSender(),
            {
                value: toNano('5'),
            },
            "push",
        );

        expect(tx1.transactions).toHaveTransaction({
            from: deployer.address,
            to: airDrop.address,
            success: true,
        });
        console.log("deployer push Balance: ", fromNano((await blockchain.getContract(airDrop.address)).balance));


        //get the signature from mock server
        let airDropAmount: bigint = toNano('1');
        let order: bigint = 1n;
        const signatureData = beginCell().storeAddress(userTom.address).storeCoins(airDropAmount).storeCoins(order).endCell();
        const keyPair = await mnemonicToWalletKey(mnemonic);
        const signature = sign(signatureData.hash(), keyPair.secretKey);
        let signatureCell = beginCell().storeBuffer(signature).endCell();

        // claim the star token from airdrop contract
        let isClaimed = await airDrop.getIsClaim(userTom.address);
        expect(isClaimed).toBe(false);
        let isListed = await airDrop.getIsListed(order);
        expect(isListed).toBe(false);
        let beforeBalance = await userTom.getBalance();
        console.log("beforeBalance: ", fromNano(beforeBalance));

        const tx2 = await airDrop.send(
            userTom.getSender(),
            {
                value: toNano('1'),
            },
            {
                $$type: 'Claim',
                order: order,
                amount: airDropAmount,
                receiver: userTom.address,
                signature: signatureCell.asSlice(),
            },
        );

        expect(tx2.transactions).toHaveTransaction({
            from: userTom.address,
            to: airDrop.address,
            success: true,
        });

        let afterBalance = await userTom.getBalance();
        console.log("afterBalance: ", fromNano(afterBalance));
        isClaimed = await airDrop.getIsClaim(userTom.address);
        expect(isClaimed).toBe(true);
        isListed = await airDrop.getIsListed(order);
        expect(isListed).toBe(true);
    });
});