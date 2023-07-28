module.exports = {
  stakerAbi: [
      {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "inputs": [],
        "name": "chairperson",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
      },
      {
        "inputs": [
          {
            "internalType": "string",
            "name": "_name",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "_description",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "_NumOfVotes",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "_NumOfCaptions",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "_initialAcc",
            "type": "uint256"
          },
          {
            "internalType": "string[]",
            "name": "labels",
            "type": "string[]"
          }
        ],
        "name": "addModel",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function",
        "payable": true
      },
      {
        "inputs": [
          {
            "internalType": "string",
            "name": "_caption",
            "type": "string"
          },
          {
            "internalType": "uint8",
            "name": "_lbl",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "_modelId",
            "type": "uint256"
          }
        ],
        "name": "addCaption",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function",
        "payable": true
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "_idx",
            "type": "uint256"
          },
          {
            "internalType": "uint8",
            "name": "_lbl",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "_modelId",
            "type": "uint256"
          }
        ],
        "name": "reviewCaption",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function",
        "payable": true
      },
      {
        "inputs": [],
        "name": "getModels",
        "outputs": [
          {
            "components": [
              {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
              },
              {
                "internalType": "string",
                "name": "name",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "description",
                "type": "string"
              },
              {
                "internalType": "uint256",
                "name": "NumberOfVotes",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "NumberOfCaptions",
                "type": "uint256"
              },
              {
                "internalType": "string[]",
                "name": "labels",
                "type": "string[]"
              },
              {
                "internalType": "address",
                "name": "modelProviderAddr",
                "type": "address"
              },
              {
                "internalType": "uint256[]",
                "name": "accuracy",
                "type": "uint256[]"
              }
            ],
            "internalType": "struct CaptionReview.ModelInfo[]",
            "name": "",
            "type": "tuple[]"
          }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
      },
      {
        "inputs": [],
        "name": "getCaptions",
        "outputs": [
          {
            "components": [
              {
                "internalType": "string",
                "name": "content",
                "type": "string"
              },
              {
                "internalType": "uint256",
                "name": "modelId",
                "type": "uint256"
              },
              {
                "internalType": "uint8",
                "name": "proposedLabel",
                "type": "uint8"
              },
              {
                "internalType": "uint8",
                "name": "verifiedLabel",
                "type": "uint8"
              },
              {
                "internalType": "uint8[]",
                "name": "Votes",
                "type": "uint8[]"
              },
              {
                "internalType": "bool",
                "name": "verified",
                "type": "bool"
              },
              {
                "internalType": "address",
                "name": "providerAddr",
                "type": "address"
              },
              {
                "internalType": "address[]",
                "name": "voters",
                "type": "address[]"
              }
            ],
            "internalType": "struct CaptionReview.Caption[]",
            "name": "",
            "type": "tuple[]"
          }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "_idx",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "_acc",
            "type": "uint256"
          }
        ],
        "name": "addAccuracy",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256[]",
            "name": "_inputUsedCaptions",
            "type": "uint256[]"
          }
        ],
        "name": "updateCaptionTrainStatus",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ]
};
