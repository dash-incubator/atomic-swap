import { alert, state } from 'ui/components';
import { directive, dom, emitter, node, render } from 'ui/lib';
import * as ethers from 'ethers';
import * as web3 from '../web3';
import participant from '../participant';


const first = () => `
    <div class="group group--offset-top --margin-500">
        <div class="group-item --width-full">
            <div class="field field--background field--border --background-state --background-white --border-grey-500 --border-primary --border-state --flex-column --padding-300" data-focusinout="toggle">
                <span class="field-title">
                    Public ETH Address Associated With Swap
                </span>
                <label class="field-mask field-mask--input --flex-row">
                    <input class='field-tag' data-bind='{"ref": "link.tag,participate.data.eth"}' data-keydown='field.tag' type='string'>
                </label>
            </div>
        </div>

        <div class="group-item --width-full">
            <div class="field field--background field--border --background-state --background-white --border-grey-500 --border-primary --border-state --flex-column --padding-300" data-focusinout="toggle">
                <span class="field-title">
                    Your DASH Public Key
                </span>
                <label class="field-mask field-mask--input --flex-row">
                    <input class='field-tag' data-bind='{"ref": "link.tag,participate.data.dash"}' data-keydown='field.tag' type='string'>
                </label>
            </div>
        </div>
    </div>

    <div class="row --spacer-top --spacer-300">
        <div class="button --background-black --background-state --border-radius-500 --color-state --color-white --padding-500 --width-full" data-click='participate.next'>
            Next
        </div>
    </div>
`;

const second = ({ dash }) => `
    <div class='card --border --border-dashed --border-width-300 --padding --padding-500'>
        Send DASH to <b style='word-break: break-all'>${dash}</b> to fulfill your part of the swap
    </div>

    <div class="row --spacer-top --spacer-300">
        <div class="button --background-black --background-state --border-radius-500 --color-state --color-white --padding-500 --width-full" data-click='participate.done'>
            Done
        </div>
    </div>
`;

const third = () => `
    <div class='card --border --border-dashed --border-width-300 --padding --padding-500'>
        Once the initiator redeems their Dash you will be able to extract the secret.
    </div>

    <div class="row --spacer-top --spacer-300">
        <div class="button button--processing --background-black --background-state --border-radius-500 --color-state --color-white --padding-500 --width-full"></div>
    </div>
`;


let initiator,
    p;

directive.on('participate.done', async function () {
    this.element.classList.add('button--processing');

    if (await p.isFunded()) {
        alert.success('Funding transaction found, waiting for initiator to redeem the DASH');
        directive.dispatch('participate.inspect');
    }
    else {
        alert.error('Swap address has not been funded yet.');
    }

    this.element.classList.remove('button--processing');
});

async function inspect() {
    setTimeout(async () => {
        if (!(await p.isRedeemable())) {
            inspect();
        }

        alert.success('Initiator has withdrawn DASH, starting metamask transaction');

        let secret = await p.extractSecret();

        try {
            await web3.contract.redeem(initiator, secret).then((response) => {
                response.wait().then((receipt) => {
                    directive.dispatch('page.initiate');
                    window.open(`https://ropsten.etherscan.io/tx/${receipt.transactionHash.toString()}`, '_blank');
                });
            });

            alert.success('Redeem transaction created successfully, the etherscan transaction will open in a new tab once it has been confirmed by the network');
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
    }, 120000);
}

directive.on('participate.inspect', async () => {
    node.html(dom.element('page.container'), {
        inner: third()
    });

    inspect();
});

directive.on('participate.next', async () => {
    let form = dom.element('participate.data');

    let dash = form.dash.value,
        data = {},
        eth = form.eth.value;

    if (!dash || !eth) {
        alert.error('Provide both addresses to continue');
        return;
    }

    data = await web3.contract._swaps(eth);

    if (!data) {
        alert.error('Atomic swap does not exist in smart contract');
        return;
    }

    initiator = eth;
    p = participant({
        dash: { public: data.dash },
        expiresAt: data.expiresAt,
        hash: data.secret.replace('0x', '')
    }, { dash: { public: dash } });

    node.html(dom.element('page.container'), {
        inner: second(data)
    });
});

directive.on('page.participate', async () => {
    node.html(dom.element('page.container'), {
        inner: first()
    });
});
