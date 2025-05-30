export type Hydrogen = {
  "version": "0.1.0",
  "name": "hydrogen",
  "instructions": [
    {
      "name": "initializeProducer",
      "accounts": [
        {
          "name": "producer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "id",
          "type": "u64"
        },
        {
          "name": "name",
          "type": "string"
        }
      ]
    },
    {
      "name": "updateProducerData",
      "accounts": [
        {
          "name": "producer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        }
      ]
    },
    {
      "name": "initializeEacStorage",
      "accounts": [
        {
          "name": "eac",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "metadataAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "producerAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "producer",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "id",
          "type": "string"
        },
        {
          "name": "tokenName",
          "type": "string"
        },
        {
          "name": "tokenSymbol",
          "type": "string"
        },
        {
          "name": "tokenUri",
          "type": "string"
        },
        {
          "name": "totalAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "addKilowattsToEac",
      "accounts": [
        {
          "name": "eac",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "substractKilowattsFromEac",
      "accounts": [
        {
          "name": "eac",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeH2Canister",
      "accounts": [
        {
          "name": "h2Canister",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "metadataAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "producerAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "producer",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "id",
          "type": "string"
        },
        {
          "name": "tokenName",
          "type": "string"
        },
        {
          "name": "tokenSymbol",
          "type": "string"
        },
        {
          "name": "tokenUri",
          "type": "string"
        }
      ]
    },
    {
      "name": "producerRegisterBatch",
      "accounts": [
        {
          "name": "producer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "h2Canister",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "eac",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "h2Mint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "eacMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "producerH2Ata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "producerEacAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "id",
          "type": "string"
        },
        {
          "name": "burnedKwh",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "eac",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "certificateCapacityKwts",
            "type": "u64"
          },
          {
            "name": "availableKwts",
            "type": "u64"
          },
          {
            "name": "burnedKwts",
            "type": "u64"
          },
          {
            "name": "producerPubkey",
            "type": "publicKey"
          },
          {
            "name": "tokenMint",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "h2Canister",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "batchId",
            "type": "string"
          },
          {
            "name": "totalAmount",
            "type": "u64"
          },
          {
            "name": "availableHydrogen",
            "type": "u64"
          },
          {
            "name": "producerPubkey",
            "type": "publicKey"
          },
          {
            "name": "tokenMint",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "producer",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "type": "u64"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "authority",
            "type": "publicKey"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "Unauthorized",
      "msg": "You are not authorized to update this PDA."
    }
  ]
};

export const IDL: Hydrogen = {
  "version": "0.1.0",
  "name": "hydrogen",
  "instructions": [
    {
      "name": "initializeProducer",
      "accounts": [
        {
          "name": "producer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "id",
          "type": "u64"
        },
        {
          "name": "name",
          "type": "string"
        }
      ]
    },
    {
      "name": "updateProducerData",
      "accounts": [
        {
          "name": "producer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        }
      ]
    },
    {
      "name": "initializeEacStorage",
      "accounts": [
        {
          "name": "eac",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "metadataAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "producerAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "producer",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "id",
          "type": "string"
        },
        {
          "name": "tokenName",
          "type": "string"
        },
        {
          "name": "tokenSymbol",
          "type": "string"
        },
        {
          "name": "tokenUri",
          "type": "string"
        },
        {
          "name": "totalAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "addKilowattsToEac",
      "accounts": [
        {
          "name": "eac",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "substractKilowattsFromEac",
      "accounts": [
        {
          "name": "eac",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeH2Canister",
      "accounts": [
        {
          "name": "h2Canister",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "metadataAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "producerAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "producer",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "id",
          "type": "string"
        },
        {
          "name": "tokenName",
          "type": "string"
        },
        {
          "name": "tokenSymbol",
          "type": "string"
        },
        {
          "name": "tokenUri",
          "type": "string"
        }
      ]
    },
    {
      "name": "producerRegisterBatch",
      "accounts": [
        {
          "name": "producer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "h2Canister",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "eac",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "h2Mint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "eacMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "producerH2Ata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "producerEacAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "id",
          "type": "string"
        },
        {
          "name": "burnedKwh",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "eac",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "certificateCapacityKwts",
            "type": "u64"
          },
          {
            "name": "availableKwts",
            "type": "u64"
          },
          {
            "name": "burnedKwts",
            "type": "u64"
          },
          {
            "name": "producerPubkey",
            "type": "publicKey"
          },
          {
            "name": "tokenMint",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "h2Canister",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "batchId",
            "type": "string"
          },
          {
            "name": "totalAmount",
            "type": "u64"
          },
          {
            "name": "availableHydrogen",
            "type": "u64"
          },
          {
            "name": "producerPubkey",
            "type": "publicKey"
          },
          {
            "name": "tokenMint",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "producer",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "type": "u64"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "authority",
            "type": "publicKey"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "Unauthorized",
      "msg": "You are not authorized to update this PDA."
    }
  ]
};
