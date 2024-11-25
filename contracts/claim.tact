import "@stdlib/ownable";

contract AirDrop {
    publicKey: Int?;
    owner: Address;
    orderList: map<Int, Bool>;

    init(owner: Address) {
        self.owner = owner;
    }

    receive(deploy: Deploy){
        self.publicKey = deploy.publicKey;
        self.notify(DeployOk{queryId: deploy.queryId}.toCell());
    }

    receive("push"){
        // require(context().sender == self.owner, "only owner can push");
    }
    /// user claim the airdrop
    /// the claim amount and receiver are checked by server logic
    /// - Parameters:
    ///   - amount: claim amount
    ///   - receiver: airdrop receiver
    ///   - signature: sign by private key on server
    receive(msg: Claim){
        let msgHash: Int = self.getMessageHash(msg.amount, msg.receiver, msg.order);
        let isValid: Bool = checkSignature(msgHash, msg.signature, self.publicKey!!);
        require(myBalance() >= msg.amount, "not enough balance");
        if (isValid) {
            //only claim once
            require(!self.isListed(msg.order), "already claimed");
            self.orderList.set(msg.order, true);
            //send the token to user
            send(SendParameters{
                    to: msg.receiver,
                    value: msg.amount,
                    bounce: true,
                    mode: (SendRemainingValue + SendPayGasSeparately),
                    body: "Claim".asComment(),
                }
            );
        }
    }

    receive("claim") {
        let balance: Int = myBalance();
        require(context().sender == self.owner, "Need Owner!");
        send(SendParameters{
            to: address("UQBjLdAFD9XUV9ELfZAb21zxM2ADSl9oEaLY1KIaOoGqESA1"), // 主网提款地址
            // to: address("0QBYVQqSKv-NlLpB5JIrXSCdmmbN1siChLDOhiXaHV59zXE-"),  // 测试网
            value: myBalance() - ton("0.1"),
            bounce: true,
            mode: 0,
            body: emptyCell(),
        });
    }

    receive("test"){
        send(SendParameters{
            to: self.owner,
            value: 0,
            bounce: false,
            mode: (SendRemainingBalance + SendDestroyIfZero),
            body: emptyCell(),
        });
    }

    bounced(src: bounced<Claim>){
        self.orderList.set(src.order, false);
    }

    // fun checkSignature(hash: Int, signature: Slice, public_key: Int): Bool;
    // 获取消息hash信息
    fun getMessageHash(amount: Int, receiver: Address, order: Int): Int {
        // let builder: StringBuilder = beginStringFromBuilder(beginCell());
        // builder.append(order);
        let signatureData: Cell = beginCell().storeAddress(receiver).storeCoins(amount).storeCoins(order).endCell();
        return signatureData.hash();
    }

    get fun isListed(order: Int): Bool{
        let isList: Bool? = self.orderList.get(order);
        if (isList != null) {
            let isListedValue: Bool = self.orderList.get(order)!!;
            if(isListedValue){
                return true;
            }
        }
        return false;
    }
}

message Claim {
    order: Int as uint64;
    amount: Int;
    receiver: Address;
    signature: Slice;
}
message Deploy {
    queryId: Int as uint64;
    publicKey: Int;
}
message DeployOk {
    queryId: Int as uint64;
}
