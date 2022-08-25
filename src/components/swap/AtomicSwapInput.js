import { crypto, Transaction } from '@dashevo/dashcore-lib';
import { AtomicSwapUnlockingScript } from './AtomicSwapUnlockingScript.js';
import { AtomicSwapRefundUnlockingScript } from './AtomicSwapRefundUnlockingScript.js';


class AtomicSwapInput extends Transaction.Input {

    constructor(swap_address, fundingTxId, fundingTxOutputIndex, amount, redeemScript) {
        super({
            address: swap_address,
            prevTxId: fundingTxId,
            outputIndex: fundingTxOutputIndex,
            script: redeemScript,
            satoshis: amount
        });
        this.redeemScript = redeemScript;
        this.secret = null;
    }

    addSignature(transaction, signature) {
        this.setScript(
            this.secret === null
                ? new AtomicSwapRefundUnlockingScript(this.redeemScript, signature)
                : new AtomicSwapUnlockingScript(this.secret, this.redeemScript, signature)
        );

        return this;
    }

    extractSecret() {
        return this.script.getSecret();
    }

    getSignatures(transaction, privateKey, index) {
        return [new Transaction.Signature({
            publicKey: privateKey.publicKey,
            prevTxId: this.prevTxId,
            outputIndex: this.outputIndex,
            inputIndex: index,
            signature: this.getSignature(transaction, privateKey),
            sigtype: crypto.Signature.SIGHASH_ALL
          })];
    }

    getSignature(transaction, privateKey) {
        return Transaction.Sighash.sign(
            transaction,
            privateKey,
            crypto.Signature.SIGHASH_ALL,
            0, // only one input to sign
            this.script
        );
    }

    setSecret(secret) {
        this.secret = secret;
        return this;
    }
}

export { AtomicSwapInput }
