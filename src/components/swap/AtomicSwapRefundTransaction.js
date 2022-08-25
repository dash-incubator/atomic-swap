import { Transaction } from '@dashevo/dashcore-lib';
import { AtomicSwapInput } from './AtomicSwapInput';
import { AtomicSwapRefundUnlockingScript } from './AtomicSwapRefundUnlockingScript';


class AtomicSwapRefundTransaction extends Transaction {

    constructor(swap_address, fundingTxId, fundingTxOutputIndex, amount, toAddress, redeemScript) {
        let input = new AtomicSwapInput(swap_address, fundingTxId, fundingTxOutputIndex, amount, redeemScript);

        input.sequenceNumber = redeemScript.locktime();

        super()
            .uncheckedAddInput(input)
            .to(toAddress, amount); //TODO calculate fee
    }

    canHaveNoUtxo() {
        return true; //TODO this is a temporary workaround
    }

    /**
     * Deserialize an atomic swap redeem transaction from hex
     * @param {String, Buffer} hex
     */
    static fromHex(hex) {
        //TODO add validation to make sure this is an atomic swap refund transaction
        let transaction = new Transaction(hex);

        Object.setPrototypeOf(transaction, AtomicSwapRefundTransaction.prototype);
        Object.setPrototypeOf(transaction.inputs[0], AtomicSwapInput.prototype);
        Object.setPrototypeOf(transaction.inputs[0].script, AtomicSwapRefundUnlockingScript.prototype);

        return transaction;
    }

    async submitViaRPC(rpcClient) {
        return rpcClient.sendRawTransaction(this);
    }
}

export { AtomicSwapRefundTransaction }
