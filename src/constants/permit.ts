import { ChainId } from '@kyberswap/ks-sdk-core'

export enum PermitType {
  AMOUNT = 1,
  SALT = 2,
}

export interface PermitInfo {
  type: PermitType
  // version is optional, and if omitted, will not be included in the domain
  version?: string
}

export const PERMITTABLE_TOKENS: {
  [chainId: number]: {
    [checksummedTokenAddress: string]: PermitInfo
  }
} = {
  [ChainId.MAINNET]: {
    // '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': { type: PermitType.SALT, version: '1' }, // USDC // TODO: viet-nv will check these tokens later
    // '0x6B175474E89094C44Da98b954EedeAC495271d0F': { type: PermitType.SALT, version: '1' }, // DAI
    '0xba100000625a3754423978a60c9317c58a424e3D': { type: PermitType.AMOUNT, version: '1' }, // BAL
    '0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72': { type: PermitType.AMOUNT, version: '1' }, // ENS
    '0x0C0F2b41F758d66bB8e694693B0f9e6FaE726499': { type: PermitType.AMOUNT, version: '1' }, // UND
    '0x27702a26126e0B3702af63Ee09aC4d1A084EF628': { type: PermitType.AMOUNT, version: '1' }, // ALEPH
  },
  [ChainId.MATIC]: {
    '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174': { type: PermitType.SALT, version: '1' }, // USDC
    '0x4e3Decbb3645551B8A19f0eA1678079FCB33fB4c': { type: PermitType.AMOUNT, version: '1' }, // jEUR
    '0x767058F11800FBA6A682E73A6e79ec5eB74Fac8c': { type: PermitType.AMOUNT, version: '1' }, // jGBP
    '0xbD1463F02f61676d53fd183C2B19282BFF93D099': { type: PermitType.AMOUNT, version: '1' }, // jCHF
    '0xFbBd93fC3BE8B048c007666AF4846e4A36BACC95': { type: PermitType.AMOUNT, version: '1' }, // RIKEN
    '0xD81F558b71A5323e433729009D55159955F8A7f9': { type: PermitType.AMOUNT, version: '1' }, // UNB
    '0x1eBA4B44C4F8cc2695347C6a78F0B7a002d26413': { type: PermitType.AMOUNT, version: '1' }, // UND
    '0x9111D6446Ac5b88A84cf06425c6286658368542F': { type: PermitType.AMOUNT, version: '1' }, // FLAG - PoS
    '0xf8F9efC0db77d8881500bb06FF5D6ABc3070E695': { type: PermitType.AMOUNT, version: '1' }, // SYN
    '0xcaF5191fc480F43e4DF80106c7695ECA56E48B18': { type: PermitType.AMOUNT, version: '1' }, // DNXC
    '0xeEeEEb57642040bE42185f49C52F7E9B38f8eeeE': { type: PermitType.AMOUNT, version: '1' }, // ELK
    '0x8497842420cFdbc97896C2353D75d89Fc8D5Be5D': { type: PermitType.AMOUNT, version: '1' }, // VERSA
  },
  [ChainId.CRONOS]: {
    '0xe6801928061CDbE32AC5AD0634427E140EFd05F9': { type: PermitType.AMOUNT, version: '1' }, //BIFI
  },
  [ChainId.ARBITRUM]: {
    // '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1': { type: PermitType.SALT, version: '1' },
    // '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8': { type: PermitType.SALT, version: '1' }, //USDC
    '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9': { type: PermitType.AMOUNT, version: '1' }, //USDT
    '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1': { type: PermitType.AMOUNT, version: '1' }, //WETH
    '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f': { type: PermitType.AMOUNT, version: '1' }, //WBTC
    '0xFEa7a6a0B346362BF88A9e4A88416B77a57D6c2A': { type: PermitType.AMOUNT, version: '1' }, //MIM
    '0x9d2F299715D94d8A7E6F5eaa8E654E8c74a988A7': { type: PermitType.AMOUNT, version: '1' }, //FXS
    '0x080F6AEd32Fc474DD5717105Dba5ea57268F46eb': { type: PermitType.AMOUNT, version: '1' }, //SYN
    '0x319f865b287fCC10b30d8cE6144e8b6D1b476999': { type: PermitType.AMOUNT, version: '1' }, //CTSI
    '0x99C409E5f62E4bd2AC142f17caFb6810B8F0BAAE': { type: PermitType.AMOUNT, version: '1' }, //BIFI
    '0x68eAd55C258d6fa5e46D67fc90f53211Eab885BE': { type: PermitType.AMOUNT, version: '1' }, //POP
    '0xD74f5255D557944cf7Dd0E45FF521520002D5748': { type: PermitType.AMOUNT, version: '1' }, //USDs
    '0x21E60EE73F17AC0A411ae5D690f908c3ED66Fe12': { type: PermitType.AMOUNT, version: '1' }, //DERI
    '0xe4DDDfe67E7164b0FE14E218d80dC4C08eDC01cB': { type: PermitType.AMOUNT, version: '1' }, //KNC
  },
  [ChainId.BSCMAINNET]: {
    // '0xD6Cce248263ea1e2b8cB765178C944Fc16Ed0727': { type: PermitType.SALT, version: '1' },
  },
  [ChainId.OPTIMISM]: {
    // '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1': { type: PermitType.SALT, version: '1' },
    // '0xbfD291DA8A403DAAF7e5E9DC1ec0aCEaCd4848B9': { type: PermitType.SALT, version: '1' },
    '0x5029c236320b8f15ef0a657054b84d90bfbeded3': { type: PermitType.AMOUNT, version: '1' }, // BitANT
    '0x7b0bcc23851bbf7601efc9e9fe532bf5284f65d3': { type: PermitType.AMOUNT, version: '1' }, // EST
    '0x76fb31fb4af56892a25e32cfc43de717950c9278': { type: PermitType.AMOUNT, version: '1' }, // AAVE
    '0x4200000000000000000000000000000000000042': { type: PermitType.AMOUNT, version: '1' }, // OP
    '0x2e3d870790dc77a83dd1d18184acc7439a53f475': { type: PermitType.AMOUNT, version: '1' }, // FRAX
    '0x67ccea5bb16181e7b4109c9c2143c24a1c2205be': { type: PermitType.AMOUNT, version: '1' }, // FXS
    '0xb12c13e66ade1f72f71834f2fc5082db8c091358': { type: PermitType.AMOUNT, version: '1' }, // ROOBEE
  },
  [ChainId.AVAXMAINNET]: {
    // '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E': { type: PermitType.SALT, version: '1' },
    // '0xb599c3590F42f8F995ECfa0f85D2980B76862fc1': { type: PermitType.SALT, version: '1' },
    '0x39fC9e94Caeacb435842FADeDeCB783589F50f5f': { type: PermitType.AMOUNT, version: '1' }, // KNC
    '0x130966628846BFd36ff31a822705796e8cb8C18D': { type: PermitType.AMOUNT, version: '1' }, // MIM
    '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7': { type: PermitType.AMOUNT, version: '1' }, // USDt
    '0x237917E8a998b37759c8EE2fAa529D60c66c2927': { type: PermitType.AMOUNT, version: '1' }, // sifu
    '0x63682bDC5f875e9bF69E201550658492C9763F89': { type: PermitType.AMOUNT, version: '1' }, // BSGG
    '0xb54f16fB19478766A268F172C9480f8da1a7c9C3': { type: PermitType.AMOUNT, version: '1' }, // TIME
  },
  [ChainId.FANTOM]: {
    '0x6a07A792ab2965C72a5B8088d3a069A7aC3a993B': { type: PermitType.AMOUNT, version: '1' }, //AAVE
    '0x753fbc5800a8C8e3Fb6DC6415810d627A387Dfc9': { type: PermitType.AMOUNT, version: '1' }, //BADGER
    '0x46E7628E8b4350b2716ab470eE0bA1fa9e76c6C5': { type: PermitType.AMOUNT, version: '1' }, //BAND
    '0x841FAD6EAe12c286d1Fd18d1d525DFfA75C7EFFE': { type: PermitType.AMOUNT, version: '1' }, //BOO
    '0xB01E8419d842beebf1b70A7b5f7142abbaf7159D': { type: PermitType.AMOUNT, version: '1' }, //COVER
    '0x657A1861c15A3deD9AF0B6799a195a249ebdCbc6': { type: PermitType.AMOUNT, version: '1' }, //CREAM
    '0x1E4F97b9f9F913c46F1632781732927B9019C68b': { type: PermitType.AMOUNT, version: '1' }, //CRV
    '0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E': { type: PermitType.AMOUNT, version: '1' }, //DAI
    '0x049d68029688eAbF473097a2fC38ef61633A3C7A': { type: PermitType.AMOUNT, version: '1' }, //fUSDT
    '0xC1Be9a4D5D45BeeACAE296a7BD5fADBfc14602C4': { type: PermitType.AMOUNT, version: '1' }, //GTON
    '0xf16e81dce15B08F326220742020379B855B87DF9': { type: PermitType.AMOUNT, version: '1' }, //ICE
    '0xb3654dc3D10Ea7645f8319668E8F54d2574FBdC8': { type: PermitType.AMOUNT, version: '1' }, //LINK
    '0x56ee926bD8c72B2d5fa1aF4d9E4Cbb515a1E3Adc': { type: PermitType.AMOUNT, version: '1' }, //SNX
    '0xae75A438b2E0cB8Bb01Ec1E1e376De11D44477CC': { type: PermitType.AMOUNT, version: '1' }, //SUSHI
    '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75': { type: PermitType.AMOUNT, version: '1' }, //USDC
    '0x321162Cd933E2Be498Cd2267a90534A804051b11': { type: PermitType.AMOUNT, version: '1' }, //BTC
    '0x74b23882a30290451A17c44f4F05243b6b58C76d': { type: PermitType.AMOUNT, version: '1' }, //ETH
    '0x29b0Da86e484E1C0029B56e817912d778aC0EC69': { type: PermitType.AMOUNT, version: '1' }, //YFI
    '0x82F8Cb20c14F134fe6Ebf7aC3B903B2117aAfa62': { type: PermitType.AMOUNT, version: '1' }, //FXS
    '0xbFaf328Fe059c53D936876141f38089df0D1503D': { type: PermitType.AMOUNT, version: '1' }, //MM
    '0xD67de0e0a0Fd7b15dC8348Bb9BE742F3c5850454': { type: PermitType.AMOUNT, version: '1' }, //BNB
    '0xD0660cD418a64a1d44E9214ad8e459324D8157f1': { type: PermitType.AMOUNT, version: '1' }, //WOOFY
    '0xd6070ae98b8069de6B494332d1A1a81B6179D960': { type: PermitType.AMOUNT, version: '1' }, //BIFI
    '0x82f0B8B456c1A451378467398982d4834b6829c1': { type: PermitType.AMOUNT, version: '1' }, //MIM
    '0x3A3841f5fa9f2c283EA567d5Aeea3Af022dD2262': { type: PermitType.AMOUNT, version: '1' }, //SHADE
    '0x818ec0A7Fe18Ff94269904fCED6AE3DaE6d6dC0b': { type: PermitType.AMOUNT, version: '1' }, //ATRI
    '0x627524d78B4fC840C887ffeC90563c7A42b671fD': { type: PermitType.AMOUNT, version: '1' }, //KEK
    '0x9fC071cE771c7B27b7d9A57C32c0a84c18200F8a': { type: PermitType.AMOUNT, version: '1' }, //iFUSD
    '0x195FE0c899434fB47Cd6c1A09ba9DA56A1Cca12C': { type: PermitType.AMOUNT, version: '1' }, //MUNNY
    '0x47d0d625638b56084e76b8720475d175d171af9A': { type: PermitType.AMOUNT, version: '1' }, //PENNI
    '0x05848B832E872d9eDd84AC5718D58f21fD9c9649': { type: PermitType.AMOUNT, version: '1' }, //STEAK
    '0x6626c47c00F1D87902fc13EECfaC3ed06D5E8D8a': { type: PermitType.AMOUNT, version: '1' }, //WOO
    '0x468003B688943977e6130F4F68F23aad939a1040': { type: PermitType.AMOUNT, version: '1' }, //SPELL
    '0xbbc4A8d076F4B1888fec42581B6fc58d242CF2D5': { type: PermitType.AMOUNT, version: '1' }, //FONT
    '0x6a545f9c64d8f7B957D8D2e6410B52095A9E6c29': { type: PermitType.AMOUNT, version: '1' }, //CFi
    '0x3129662808bEC728a27Ab6a6b9AFd3cBacA8A43c': { type: PermitType.AMOUNT, version: '1' }, //DOLA
    '0xb84527D59b6Ecb96F433029ECc890D4492C5dCe1': { type: PermitType.AMOUNT, version: '1' }, //INV
    '0x3b57f3FeAaF1e8254ec680275Ee6E7727C7413c7': { type: PermitType.AMOUNT, version: '1' }, //EXOD
    '0x5d5530eb3147152FE78d5C4bFEeDe054c8d1442A': { type: PermitType.AMOUNT, version: '1' }, //FEED
    '0xEFF6FcfBc2383857Dd66ddf57effFC00d58b7d9D': { type: PermitType.AMOUNT, version: '1' }, //JulD
    '0x5C4FDfc5233f935f20D2aDbA572F770c2E377Ab0': { type: PermitType.AMOUNT, version: '1' }, //HEC
    '0x5602df4A94eB6C680190ACCFA2A475621E0ddBdc': { type: PermitType.AMOUNT, version: '1' }, //SPA
    '0x9F47F313ACFd4bdC52F4373b493EaE7d5aC5b765': { type: PermitType.AMOUNT, version: '1' }, //JOE
    '0xfa1FBb8Ef55A4855E5688C0eE13aC3f202486286': { type: PermitType.AMOUNT, version: '1' }, //FHM
    '0x9879aBDea01a879644185341F7aF7d8343556B7a': { type: PermitType.AMOUNT, version: '1' }, //TUSD
    '0x6496994241804D7fE2b032901931e03bCD82301F': { type: PermitType.AMOUNT, version: '1' }, //MODA
    '0xB66b5D38E183De42F21e92aBcAF3c712dd5d6286': { type: PermitType.AMOUNT, version: '1' }, //PILLS
    '0xfB98B335551a418cD0737375a2ea0ded62Ea213b': { type: PermitType.AMOUNT, version: '1' }, //miMATIC
    '0xDDc0385169797937066bBd8EF409b5B3c0dFEB52': { type: PermitType.AMOUNT, version: '1' }, //wMEMO
  },
}

export const EIP712_DOMAIN_TYPE = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
]

export const EIP712_DOMAIN_TYPE_SALT = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'verifyingContract', type: 'address' },
  { name: 'salt', type: 'bytes32' },
]
