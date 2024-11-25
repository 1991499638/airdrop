import { TonClient4 } from '@ton/ton';
import { Address, toNano } from '@ton/core';
import { AirDrop, storeClaim } from '../build/Claim/tact_AirDrop';
import * as dotenv from 'dotenv';
import { getHttpV4Endpoint } from "@orbs-network/ton-access";
dotenv.config();

(async () => {
    const client = new TonClient4({
        endpoint: await getHttpV4Endpoint({
            network: "testnet",
        })
    });
    const claim = client.open(AirDrop.fromAddress(Address.parse(process.env.CLAIM_CONTRACT_ADDRESS as string)));
    console.log(await claim.getIsListed(12345n));
})()


const message_body = {
    order: 12354n,
    amount: toNano('0.15'),
    receiver: provider.sender().address as Address,
}
const body = beginCell()
    .store(
        storeClaim(        {
            $$type: 'Claim',
            order:,
            amount: ,
            receiver: ,
            signature: ,
        })
).endCell()