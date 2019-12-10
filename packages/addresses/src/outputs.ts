/* tslint:disable */

export const outputs = 
{
  "3-staging": {
    "human_friendly_name": "ropsten-staging",
    "addresses": {
      "Cards": "0xADC559D1afbCBBf427728577F40E7358D96F1209",
      "OpenMinter": "0x36F26280B80e609e347c843E2AE5351Ee4b5f7eD",
      "Forwarder": "0x78798915cb0fE78354454aFe9C0d224af495B505"
    },
    "dependencies": {
      "WETH": "0xc778417e063141139fce010982780140aa0cd5ab",
      "ZERO_EX_EXCHANGE": "0xbff9493f92a3df4b0429b6d00743b3cfb4c85831",
      "ZERO_EX_ERC20_PROXY": "0xb1408f4c245a23c31b98d2c626777d4c0d766caa",
      "ZERO_EX_ERC721_PROXY": "0xe654aac058bfbf9f83fcaee7793311dd82f6ddb4"
    }
  },
  "1-production": {
    "human_friendly_name": "main-net-production",
    "addresses": {
      "Cards": "0x0e3a2a1f2146d86a604adc220b4967a898d7fe07",
      "Forwarder": "0xb04239b53806ab31141e6cd47c63fb3480cac908"
    },
    "dependencies": {
      "WETH": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      "ZERO_EX_EXCHANGE": "0x080bf510fcbf18b91105470639e9561022937712",
      "ZERO_EX_ERC20_PROXY": "0x95e6f48254609a6ee006f7d493c8e5fb97094cef",
      "ZERO_EX_ERC721_PROXY": "0xefc70a1b18c432bdc64b596838b4d138f6bc6cad"
    },
    "state": {
      "network_id": 1
    }
  },
  "50-development": {
    "human_friendly_name": "test-rpc-development",
    "addresses": {
      "Cards": "0x7245C578E9a948253c6201Dc3D1a67D8F70d6aa8",
      "OpenMinter": "0xcd95207B2F4D22b126B97d87D8625Ea425665e50",
      "Forwarder": "0xAdfF0F58df8A97aECaA9CCE119ab9EfC944207De",
      "Registry": "0xbC9a810fC033E449C7f9d78c96543320D1490f00",
      "LockLimiter": "0xadC7A20E2f1186D918648E64e41023d19493b545",
      "BackupModule": "0x8F155300fA9F2eC7C6B0ee2dad7F2AbCda77F580",
      "PurchaseModule": "0xCC14cCB5F5a97CEa8Cf48D6EbB7AA86f4C9A4EE0",
      "RecoveryModule": "0xd11ab8c2Ef292860EDD1e2471eD7B3e97F0dd6D6",
      "TransferModule": "0x360eE37076FaBf6151A4054360F94D67e35467cD",
      "LimitedModule": "0xC034906E670839696C659429d7c14f312F258782",
      "SimpleDelegate": "0x7DdBA46c76b3383c25409d0630525a0dAC3Da0Cb",
      "MultiLimiter": "0x5da711227708f00CCbCfA065Fed44F6cceefF804",
      "WalletFactory": "0xC6EaFFDAed6314f4D4f3dAB5C4bFD72b3d96e263",
      "TestWallet": "0x7a545dcef97F72591BA186afFCABF8d657AC277C"
    },
    "dependencies": {
      "ZERO_EX_EXCHANGE": "0x48bacb9266a570d521063ef5dd96e61686dbe788",
      "ZERO_EX_ERC20_PROXY": "0x1dc4c1cefef38a777b15aa20260a54e584b16c48",
      "ZERO_EX_ERC721_PROXY": "0x1d7022f5b17d2f8b695918fb48fa1089c9f85401",
      "WETH": "0x0b1ba0af832d7c05fd64161e0db78e85978e8082"
    },
    "state": {
      "network_id": 50
    }
  },
  "3-development": {
    "human_friendly_name": "ropsten-development",
    "addresses": {
      "Cards": "0x7D637F5Bfa8E65d5A50316245867994Af586451d",
      "OpenMinter": "0x331e1b1c9ae7234027eE9908280F5901162d41d0",
      "Registry": "0xD3FFeaCEd9F568944f08c04040B72B14A4d7d498",
      "LockLimiter": "0xfc73c616DF2cd14fa4662A4D99C81b10F35DB355",
      "BackupModule": "0x18d01f7cDd8E736a3b83D6fFE92C733C636aB83d"
    },
    "dependencies": {},
    "state": {
      "network_id": 3
    }
  }
}