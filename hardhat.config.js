require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-etherscan');

if (process.env.REPORT_GAS) {
    require('hardhat-gas-reporter');
}

if (process.env.REPORT_COVERAGE) {
    require('solidity-coverage');
}


let { mainnet, ropsten } = require('./secrets.json');


/**
 *  @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
    etherscan: {
        apiKey: {
            mainnet: mainnet.etherscan,
            ropsten: ropsten.etherscan
        }
    },
    gasReporter: {
        currency: 'USD',
        gasPrice: 100,
        showTimeSpent: true,
    },
    networks: {
        mainnet: {
            url: mainnet.url,
            accounts: [mainnet.privateKey]
        },
        ropsten: {
            url: ropsten.url,
            accounts: [ropsten.privateKey]
        }
    },
    plugins: ['solidity-coverage'],
    solidity: {
        settings: {
            optimizer: {
                enabled: true,
                runs: 800,
            },
        },
        version: '0.8.15'
    }
};
