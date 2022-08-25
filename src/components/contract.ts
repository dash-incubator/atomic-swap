const abi: any = [
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "input",
          "type": "string"
        }
      ],
      "name": "InvalidInput",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "PendingSwapAlreadyExists",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "SwapCannotBeRefundedUntilExpired",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "SwapDoesntExist",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "TransferFailed",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "_swaps",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "dash",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "expiresAt",
          "type": "uint256"
        },
        {
          "internalType": "bytes32",
          "name": "secret",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "dash",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "expiresAt",
          "type": "uint256"
        },
        {
          "internalType": "bytes32",
          "name": "secret",
          "type": "bytes32"
        }
      ],
      "name": "initializeETH",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "initiator",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "secret",
          "type": "string"
        }
      ],
      "name": "redeem",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "refund",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];
const address: string = '0xFD0189187F89D9b435d234EB1F837F8363E084d0';

export default { abi, address };
export { abi, address };
