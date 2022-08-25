// @ts-ignore
import { alert, state } from 'ui/components';
// @ts-ignore
import { directive, dom, emitter, node } from 'ui/lib';
import { MetaMaskInpageProvider } from "@metamask/providers";
import { Contract, providers } from 'ethers';
import { abi, address } from './contract';


declare global {
    interface Window {
        ethereum: MetaMaskInpageProvider;
    }
}


let contract: any,
    provider: providers.Web3Provider | null = null,
    signer;


const connect = async (reconnect = false): Promise<void> => {
    if (reconnect) {
        contract = null;
        provider = null;
        signer = null;
    }

    if (provider) {
        return;
    }

    try {
        if (typeof window.ethereum !== 'undefined') {
            await window.ethereum.request({ method: 'eth_requestAccounts' });

            // @ts-ignore
            provider = new providers.Web3Provider( window.ethereum );
            signer = provider.getSigner();
            contract = new Contract(address, abi, signer);
        }
    }
    catch (e) {
        provider = null;
    }

    if (provider) {
        dom.update(() => {
            state.deactivate( dom.element('web3.connect.button') );
            state.activate( dom.element('web3.connected.button') );
        });
    }
};

const isConnected = (): boolean => {
    return provider != null;
};

const reconnect = async (): Promise<void> => {
    await connect(true);
};


let attempted: boolean = false;

directive.on('web3.connect', connect);
emitter.on('components.mount', async () => {
    if (attempted) {
        return;
    }

    attempted = true;

    await connect();
});


export { connect, contract, isConnected, provider, reconnect, signer };
