const hardhat = require('hardhat');


async function main(name) {
    const factory = await hardhat.ethers.getContractFactory(name);
    const contract = await factory.deploy();

    await contract.deployed();

    console.log('Contract Address: ', contract.address);
}


main('AtomicSwap')
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
