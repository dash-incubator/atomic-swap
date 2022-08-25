import { crypto, Opcode, Script } from '@dashevo/dashcore-lib';
import BufferUtil from '@dashevo/dashcore-lib/lib/util/buffer.js';


class AtomicSwapRefundUnlockingScript extends Script {

    /**
     * Create an unlocking script to refund from an Atomic Swap contract
     * @param {Script} redeemScript used to create Atomic Swap contract
     * @param {TransactionSignature} signature Signature from spending transaction
     */
    constructor(redeemScript, signature) {
        let sigBuffer = BufferUtil.concat([
                signature.signature.toDER(),
                BufferUtil.integerAsSingleByteBuffer(crypto.Signature.SIGHASH_ALL)
            ]),
            unlockingScript = super()
                .add(sigBuffer)
                .add(Opcode.OP_FALSE)
                .add(Buffer.from(redeemScript.toHex(), 'hex'));

        return unlockingScript;
    }

    /**
     * Deserialize an atomic swap unlocking script from hex
     * @param {String} hex Hex encoded string
     */
    static fromHex(hex) {
        let script = super.fromHex(hex);

        Object.setPrototypeOf(script, AtomicSwapRefundUnlockingScript.prototype);

        return script;
    }

    /**
     * Returns the secret used to unlock the transaction
     * @returns {String} The secret as a hex string
     */
    getSecret() {
        return this.chunks[1].buf;
    }
}


export { AtomicSwapRefundUnlockingScript }
