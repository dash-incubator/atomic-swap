import { alert, state } from 'ui/components';
import { directive, dom, emitter, node, render } from 'ui/lib';
import * as ethers from 'ethers';
import { sha256 } from '../utilities';
import * as web3 from '../web3';
import dash from '@dashevo/dashcore-lib';
import { Wallet } from '@dashevo/wallet-lib';


function timestampToDatetimeInputString(timestamp) {
    const date = new Date((timestamp + new Date().getTimezoneOffset() * -60 * 1000));

    // slice(0, 19) includes seconds
    return date.toISOString().slice(0, 19);
}


const form = () => `
    <div class="group group--offset-top --margin-500">
        <div class="group-item --width-full">
            <div class="field field--background field--border --background-state --background-white --border-grey-500 --border-primary --border-state --flex-column --padding-300" data-focusinout="toggle">
                <span class="field-title">
                    Ethereum
                </span>
                <label class="field-mask field-mask--input --flex-row">
                    <input class='field-tag' data-bind='{"ref": "link.tag,initiate.data.eth"}' data-keydown='field.tag' min='0' placeholder='Total ETH' type='number'>
                </label>
            </div>
        </div>

        <div class="group-item --width-full">
            <div class="field field--background field--border --background-state --background-white --border-grey-500 --border-radius-500 --border-primary --border-state --flex-column" data-focusinout="toggle">
               <div class="field-title --flex-horizontal-space-between --flex-vertical">
                   Swap should expire after
               </div>
               <div class="row --flex-row --margin-top --margin-300">
                   <label class="field-mask field-mask--input --flex-row">
                       <input class='field-tag' data-bind='{"ref": "initiate.data.expiresAt"}' type="datetime-local" value='${timestampToDatetimeInputString(Date.now() + 3600000)}'>
                   </label>
               </div>
           </div>
        </div>

        <div class="group-item --width-full">
            <div class="field field--background field--border --background-state --background-white --border-grey-500 --border-primary --border-state --flex-column --padding-300" data-focusinout="toggle">
                <span class="field-title">
                    Your DASH Public Key
                </span>
                <label class="field-mask field-mask--input --flex-row">
                    <input class='field-tag' data-bind='{"ref": "link.tag,initiate.data.dash"}' data-keydown='field.tag' type='string'>
                </label>
            </div>
        </div>

        <div class="group-item --width-full">
            <div class="field field--background field--border --background-state --background-white --border-grey-500 --border-primary --border-state --flex-column --padding-300" data-focusinout="toggle">
                <span class="field-title">
                    Lock funds with secret
                </span>
                <label class="field-mask field-mask--input --flex-row">
                    <input class='field-tag' data-bind='{"ref": "link.tag,initiate.data.secret"}' data-keydown='field.tag' type='string'>
                </label>
            </div>
        </div>
    </div>

    <div class="row --spacer-top --spacer-300">
        <div class="button --background-black --background-state --border-radius-500 --color-state --color-white --padding-500 --width-full" data-click='swap.initiate'>
            Initiate Swap
        </div>
    </div>
`;

const refund = ({ amount, dash, expiresAt, secret }) => `
    <div class="group group--offset-top --margin-500">
        <div class="group-item --width-full">
            <div class='text-list'>
                <b class='text --color-text-500'>
                    ETH
                </b>
                <div class='text'>
                    ${ethers.utils.formatEther(amount)} ETH
                </div>
            </div>
        </div>

        <div class="group-item --width-full">
            <div class='text-list'>
                <b class='text --color-text-500'>
                    Your DASH Public Key
                </b>
                <div class='text' style='word-break: break-all'>
                    ${dash}
                </div>
            </div>
        </div>

        <div class="group-item --width-full">
            <div class='text-list'>
                <b class='text --color-text-500'>
                    Swap Expires After
                </b>
                <div class='text'>
                    ${new Date(expiresAt * 1000).toLocaleString()}
                </div>
            </div>
        </div>

        <div class="group-item --width-full">
            <div class='text-list'>
                <b class='text --color-text-500'>
                    Hashed Secret
                </b>
                <div class='text'>
                    <span class='--text-truncate'>
                        ${secret}
                    </span>
                </div>
            </div>
        </div>
    </div>

    <div class="row --spacer-top --spacer-300 ${expiresAt > Date.now() / 1000 ? '--not-allowed' : ''}">
        <div class="button --background-black --background-state --border-radius-500 --color-state --color-white ${expiresAt > Date.now() / 1000 ? '--disabled' : ''} --padding-500 --width-full" data-click='swap.refund'>
            Refund Swap
        </div>

         ${expiresAt > Date.now() / 1000 ? "<div class='--margin-top --margin-200 --text-300'>Swap cannot be refunded until it expires</div>" : ''}
    </div>
`;

const template = (data) => {
    if (data.dash) {
        return refund(data);
    }

    return form();
};


directive.on('swap.initiate', async function() {
    let button = this.element,
        data = dom.element('initiate.data'),
        options = {
            value: ethers.BigNumber.from(ethers.utils.parseEther(data.eth.value).toString())
        },
        swap = {};

    button.classList.add('button--processing');

    swap.dash = data.dash.value;
    swap.expiresAt = new Date(data.expiresAt.value).valueOf() / 1000;
    swap.secret = `0x${await sha256(data.secret.value)}`;

    if (!data.eth.value) {
        alert.error('You must provide ETH to continue');
    }

    if (!data.secret.value) {
        alert.error('You must provide a secret to continue');
    }

    if (!swap.dash) {
        alert.error('You must provide a dash public address to continue');
    }

    try {
        await web3.contract.initializeETH(swap.dash, swap.expiresAt, swap.secret, options).then((response) => {
            response.wait().then((receipt) => {
                button.classList.remove('button--processing');
                directive.dispatch('page.initiate');
                window.open(`https://ropsten.etherscan.io/tx/${receipt.transactionHash.toString()}`, '_blank');
            });
        });

        alert.success('ETH atomic swap transaction created successfully, the etherscan transaction will open in a new tab once it has been confirmed by the network');
    }
    catch (e) {
        let reason = e;

        if (e.toString) {
            reason = e.toString();
        }

        if (!reason) {
            reason = e?.error?.error.toString();
        }

        if (reason) {
            reason = reason.split('r: ').pop();
        }
        else {
            reason = e?.error?.reason.split(': ').pop();
        }

        if (reason) {
            reason = `: ${reason}`;
        }

        alert.error(`Contract Returned Error${reason}`);
        button.classList.remove('button--processing');
    }
});

directive.on('swap.refund', async function() {
    let address = await web3.signer.getAddress();

    try {
        await web3.contract.refund().then((response) => {
            response.wait().then((receipt) => {
                directive.dispatch('page.initiate');
                window.open(`https://ropsten.etherscan.io/tx/${receipt.transactionHash.toString()}`, '_blank');
            });
        });

        alert.success('Refund transaction created successfully, the etherscan transaction will open in a new tab once it has been confirmed by the network');
    }
    catch (e) {
        let reason = e;

        if (e.toString) {
            reason = e.toString();
        }

        if (!reason) {
            reason = e?.error?.error.toString();
        }

        if (reason) {
            reason = reason.split('r: ').pop();
        }
        else {
            reason = e?.error?.reason.split(': ').pop();
        }

        if (reason) {
            reason = `: ${reason}`;
        }

        alert.error(`Contract Returned Error${reason}`);
    }
});


let rendered = false;

directive.on('page.initiate', async () => {
    await web3.connect();

    let data = {};

    if (web3.signer) {
        let address = await web3.signer.getAddress();

        if (address) {
            data = await web3.contract._swaps(address);
        }
    }

    node.html(dom.element('page.container'), {
        inner: template(data || {})
    });
});

emitter.on('components.mount', async () => {
    if (rendered) {
        return;
    }

    rendered = true;

    // let pk = new dash.PrivateKey('b66e2820d98e98d8efd12a876e9d190a7abf1175ab24372f0d9d2d617467bc02');
    //
    // console.log({
    //     privateKey: pk.toString(),
    //     publicKey: pk.toPublicKey().toString(),
    //     publicAddress: pk.toPublicKey().toAddress(dash.Networks.testnet).toString()
    // });

    // try {
    //     console.log('connecting');
    //
    //     let wallet = new Wallet({
    //             network: 'testnet',
    //             // offlineMode: true,
    //             privateKey: 'b66e2820d98e98d8efd12a876e9d190a7abf1175ab24372f0d9d2d617467bc02'
    //         });
    //
    //     console.log('connected');
    //
    //     await wallet.getAccount().then(async (account) => {
    //         let address = account.getUnusedAddress(),
    //             balance = account.getTotalBalance();
    //
    //         console.log({ address, balance });
    //
    //         if (balance > 0) {
    //             console.log('sending');
    //
    //             await account.broadcastTransaction(account.createTransaction({
    //                 recipient: 'ycxzX8d77LBJdfXbhhrePS4ES8DNAJJEbB',
    //                 satoshis: parseInt(balance / 10, 10),
    //             })).then(() => {
    //                 console.log('sent');
    //             });
    //         }
    //     });
    // }
    // catch (e) {
    //     console.log(e);
    // }

    directive.dispatch('page.initiate');
});
