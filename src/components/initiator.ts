// @ts-ignore
import Networks from '@dashevo/dashcore-lib/lib/networks';
import { BigNumber, utils } from 'ethers';
import { sha256 } from './utilities';
import { contract } from './web3';
import rpc from './rpc';
import { RedeemScript, RedeemTransaction } from './swap';


type Initiator = {
    dash: { private: string, public: string };
    ether: number;
    // In Seconds
    expiresAt: number;
    secret: string;
};

type Participant = {
    dash: { public: string };
}


function factory(initiator: Initiator, initialize: boolean) {
    let hash = sha256(initiator.secret),
        script: any,
        utxo: any;

    if (initialize) {
        contract.initializeETH(initiator.dash.public, initiator.expiresAt, `0x${hash}`, {
            value: BigNumber.from(utils.parseEther(`${initiator.ether}`).toString())
        });
    }

    const redeem = async () => {
        if (!utxo) {
            console.error('Run `verifyFunds` before redeeming to supply the `redeem` function with utxo info');
        }

        let transaction = new RedeemTransaction(
                script.scriptAddress().toString(),
                utxo.txid,
                utxo.outputIndex,
                (utxo.satoshis - 1000),
                initiator.dash.public,
                script
            // @ts-ignore
            ).setSecret(initiator.secret).sign(initiator.dash.private);

        return await transaction.submitViaRPC(rpc.client());
    }

    const refund = async (): Promise<void> => {
        await contract.refund();
    };

    const verifyFunds = async (participant: Participant): Promise<number> => {
        script = new RedeemScript(
            // @ts-ignore
            hash,
            initiator.dash.public,
            participant.dash.public,
            (initiator.expiresAt - (Date.now() / 1000)) / 60 / 60,
            Networks.testnet
        );

        return script.getFundingUTXOs(rpc.client()).then((utxos: { satoshis: number }[]): number => {
            if (utxos.length > 0) {
                utxo = utxos[0];

                return utxo.satoshis / 100000000;
            }

            return 0;
        });
    };


    return { redeem, refund, verifyFunds };
}


const create = (data: Initiator) => {
    return factory(data, true);
};

const restore = (data: Initiator) => {
    return factory(data, false);
};


export default { create, restore };
export { create, restore };
