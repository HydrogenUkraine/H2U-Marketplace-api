export type Oracle = {
  "version": "0.1.0",
  "name": "oracle",
  "instructions": [
    {
      "name": "initConfig",
      "accounts": [
        {
          "name": "oraclePrice",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "oracleConfig",
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
      "args": []
    },
    {
      "name": "updatePrice",
      "accounts": [
        {
          "name": "oracleConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "oraclePrice",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "newMin",
          "type": "u64"
        },
        {
          "name": "newMax",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateCoinfig",
      "accounts": [
        {
          "name": "oracleConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "newAdmin",
          "type": "publicKey"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "oracleConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "oraclePrice",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "minPricePerKg",
            "type": "u64"
          },
          {
            "name": "maxPricePerKg",
            "type": "u64"
          },
          {
            "name": "lastUpdated",
            "type": "i64"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidPriceRange",
      "msg": "Minimum price must be less than maximum price."
    }
  ]
};

export const IDL: Oracle = {
  "version": "0.1.0",
  "name": "oracle",
  "instructions": [
    {
      "name": "initConfig",
      "accounts": [
        {
          "name": "oraclePrice",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "oracleConfig",
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
      "args": []
    },
    {
      "name": "updatePrice",
      "accounts": [
        {
          "name": "oracleConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "oraclePrice",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "newMin",
          "type": "u64"
        },
        {
          "name": "newMax",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateCoinfig",
      "accounts": [
        {
          "name": "oracleConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "newAdmin",
          "type": "publicKey"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "oracleConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "oraclePrice",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "minPricePerKg",
            "type": "u64"
          },
          {
            "name": "maxPricePerKg",
            "type": "u64"
          },
          {
            "name": "lastUpdated",
            "type": "i64"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidPriceRange",
      "msg": "Minimum price must be less than maximum price."
    }
  ]
};
