import { Transaction } from '@dashevo/dashcore-lib';
import { AtomicSwapInput } from './AtomicSwapInput';
import { AtomicSwapUnlockingScript } from './AtomicSwapUnlockingScript';


class AtomicSwapRedeemTransaction extends Transaction {

    constructor(swap_address, fundingTxId, fundingTxOutputIndex, amount, toAddress, redeemScript) {
        let input = new AtomicSwapInput(swap_address, fundingTxId, fundingTxOutputIndex, amount, redeemScript);

        super()
            .uncheckedAddInput(input)
            .to(toAddress, amount); //TODO calculate fee
    }

    canHaveNoUtxo() {
        return true; //TODO this is a temporary workaround
    }

    extractSecret() {
       return this.inputs[0].extractSecret();
    }

    /**
     * Deserialize an atomic swap redeem transaction from hex
     * @param {String, Buffer} hex
     */
    static fromHex(hex) {
        //TODO add validation to make sure this is an atomic swap redeem transaction
        let transaction = new Transaction(hex);

        Object.setPrototypeOf(transaction, AtomicSwapRedeemTransaction.prototype);
        Object.setPrototypeOf(transaction.inputs[0], AtomicSwapInput.prototype);
        Object.setPrototypeOf(transaction.inputs[0].script, AtomicSwapUnlockingScript.prototype);

        return transaction;
    }

    setSecret(secret) {
        this.inputs[0].setSecret(secret);

        return this;
    }

    async submitViaRPC(rpcClient) {
        return rpcClient.sendRawTransaction(this);
    }
}


export { AtomicSwapRedeemTransaction }
