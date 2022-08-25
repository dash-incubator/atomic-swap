// @ts-ignore
import Networks from '@dashevo/dashcore-lib/lib/networks';
import rpc from './rpc';
import { RedeemScript, RedeemTransaction } from './swap';


type Initiator = {
    dash: { public: string };
    expiresAt: number;
    hash: string;
};

type Participant = {
    dash: { public: string };
};


const factory = (initiator: Initiator, participant: Participant) => {
    let script: any = new RedeemScript(
            initiator.hash,
            initiator.dash.public,
            participant.dash.public,
            (initiator.expiresAt - (Date.now() / 1000)) / 60 / 60,
            Networks.testnet
        );


    console.log(`Address: ${script.scriptAddress().toString()}`);


    async function findFundingTxn() {
        return (await getRawTxnsForAddress()).filter(
            (txn: any) => isFundingTxn(txn)
        )[0];
    }

    async function findSpendingTxn() {
        return (await getRawTxnsForAddress()).filter(
            (txn: any) => !isFundingTxn(txn)
        )[0];
    }

    async function getRawTxnsForAddress(): Promise<any> {
        let client = rpc.client(),
            txns = await client.getaddresstxids({ addresses: [ script.scriptAddress().toString() ] })
                .then(async ({ result }: any) => {
                    return result.map(async function (id: any) {
                        return await client.getrawtransaction(id, 1).then(({ result }: any) => result);
                    });
                });

        return await Promise.all(txns);
    }

    function isFundingTxn(txn: any): boolean {
        return txn.vout.find(
            (output: any) => output.scriptPubKey.addresses.includes( script.scriptAddress().toString() )
        ) != undefined;
    }


    const extractSecret = async (): Promise<string|null> => {
        let txn = await findSpendingTxn();

        if (txn === undefined) {
            return null;
        }

        return RedeemTransaction.fromHex(txn.hex).extractSecret().toString();
    };

    const isFunded = async (): Promise<boolean> => {
        return await findFundingTxn() !== undefined;
    };

    const isRedeemable = async (): Promise<boolean> => {
        return await findSpendingTxn() !== undefined;
    };


    return { extractSecret, isFunded, isRedeemable };
};


export default factory;
