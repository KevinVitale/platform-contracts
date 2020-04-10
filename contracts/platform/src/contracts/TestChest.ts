import {
  Contract,
  ContractFactory,
  ContractTransaction,
  EventFilter,
  Signer
} from "ethers";
import { Listener, Provider } from "ethers/providers";
import { Arrayish, BigNumber, BigNumberish, Interface } from "ethers/utils";
import {
  TransactionOverrides,
  TypedFunctionDescription,
  TypedEventDescription
} from ".";

interface TestChestInterface extends Interface {
  functions: {
    purchase: TypedFunctionDescription<{
      encode([count]: [BigNumberish]): string;
    }>;

    escrowHook: TypedFunctionDescription<{
      encode([count]: [BigNumberish]): string;
    }>;
  };
  events: {};
}

export interface TestChest {
  interface: TestChestInterface;
  connect(signerOrProvider: Signer | Provider | string): TestChest;
  attach(addressOrName: string): TestChest;
  deployed(): Promise<TestChest>;
  on(event: EventFilter | string, listener: Listener): TestChest;
  once(event: EventFilter | string, listener: Listener): TestChest;
  addListener(eventName: EventFilter | string, listener: Listener): TestChest;
  removeAllListeners(eventName: EventFilter | string): TestChest;
  removeListener(eventName: any, listener: Listener): TestChest;

  purchase(
    count: BigNumberish,
    overrides?: TransactionOverrides
  ): Promise<ContractTransaction>;
  escrowHook(
    count: BigNumberish,
    overrides?: TransactionOverrides
  ): Promise<ContractTransaction>;

  estimate: {
    purchase(count: BigNumberish): Promise<BigNumber>;
    escrowHook(count: BigNumberish): Promise<BigNumber>;
  };
}

export class TestChest extends Contract {
  public static at(signer: Signer, addressOrName: string): TestChest {
    let factory = new ContractFactory(this.ABI, this.Bytecode, signer);
    return (factory.attach(addressOrName) as unknown) as TestChest;
  }

  public static deploy(
    signer: Signer,
    _escrow: string,
    _asset: string
  ): Promise<TestChest> {
    let factory = new ContractFactory(this.ABI, this.Bytecode, signer);
    return (factory.deploy(_escrow, _asset) as unknown) as Promise<TestChest>;
  }

  public static ABI =
    '[{"inputs":[{"internalType":"contract IEscrow","name":"_escrow","type":"address"},{"internalType":"contract TestERC20Token","name":"_asset","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"constant":false,"inputs":[{"internalType":"uint256","name":"count","type":"uint256"}],"name":"purchase","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"count","type":"uint256"}],"name":"escrowHook","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"}]';
  public static Bytecode =
    "0x608060405234801561001057600080fd5b5060405161068238038061068283398101604081905261002f91610071565b600080546001600160a01b039384166001600160a01b031991821617909155600180549290931691161790556100e4565b805161006b816100cd565b92915050565b6000806040838503121561008457600080fd5b60006100908585610060565b92505060206100a185828601610060565b9150509250929050565b600061006b826100c1565b600061006b826100ab565b6001600160a01b031690565b6100d6816100b6565b81146100e157600080fd5b50565b61058f806100f36000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c8063d158b4e21461003b578063efef39a114610050575b600080fd5b61004e610049366004610298565b610063565b005b61004e61005e366004610298565b610101565b6000546001600160a01b031633146100965760405162461bcd60e51b815260040161008d90610488565b60405180910390fd5b6001546000546040516340c10f1960e01b81526001600160a01b03928316926340c10f19926100cc929116908590600401610466565b600060405180830381600087803b1580156100e657600080fd5b505af11580156100fa573d6000803e3d6000fd5b5050505050565b610109610224565b506040805160e081018252338082526020808301919091526001546001600160a01b031682840152606080830185905260006080840181905260a084018190528451908152918201845260c0830191909152915190919061016e9084906024016104ca565b60408051601f198184030181529181526020820180516001600160e01b03166368ac5a7160e11b1790526000549051636a8573f560e11b81529192506001600160a01b03169063d50ae7ea906101cc90859030908690600401610498565b602060405180830381600087803b1580156101e657600080fd5b505af11580156101fa573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525061021e91908101906102be565b50505050565b6040518060e0016040528060006001600160a01b0316815260200160006001600160a01b0316815260200160006001600160a01b03168152602001600081526020016000815260200160008152602001606081525090565b803561028781610535565b92915050565b805161028781610535565b6000602082840312156102aa57600080fd5b60006102b6848461027c565b949350505050565b6000602082840312156102d057600080fd5b60006102b6848461028d565b60006102e8838361045d565b505060200190565b6102f9816104eb565b82525050565b600061030a826104de565b61031481856104e2565b935061031f836104d8565b8060005b8381101561034d57815161033788826102dc565b9750610342836104d8565b925050600101610323565b509495945050505050565b6000610363826104de565b61036d81856104e2565b935061037d8185602086016104ff565b6103868161052b565b9093019392505050565b600061039d601b836104e2565b7f6d7573742062652074686520657363726f7720636f6e74726163740000000000815260200192915050565b805160009060e08401906103dd85826102f0565b5060208301516103f060208601826102f0565b50604083015161040360408601826102f0565b506060830151610416606086018261045d565b506080830151610429608086018261045d565b5060a083015161043c60a086018261045d565b5060c083015184820360c086015261045482826102ff565b95945050505050565b6102f9816104fc565b6040810161047482856102f0565b610481602083018461045d565b9392505050565b6020808252810161028781610390565b606080825281016104a981866103c9565b90506104b860208301856102f0565b81810360408301526104548184610358565b60208101610287828461045d565b60200190565b5190565b90815260200190565b60006001600160a01b038216610287565b90565b60005b8381101561051a578181015183820152602001610502565b8381111561021e5750506000910152565b601f01601f191690565b61053e816104fc565b811461054957600080fd5b5056fea365627a7a7231582024727cfc4bdbf79d44f233a12ae2df354588da2e9daef9bdc66d5f24437568786c6578706572696d656e74616cf564736f6c634300050b0040";
}
