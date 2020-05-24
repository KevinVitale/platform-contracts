import 'jest';

import { Ganache, Blockchain, generatedWallets, expectRevert } from '@imtbl/test-utils';
import {
  Referral,
  EpicPack,
  Cards,
  Raffle
} from '../../../../src/contracts';
import { Wallet, ethers } from 'ethers';
import { keccak256 } from 'ethers/utils';
import { PurchaseProcessor, CreditCardEscrow, Escrow, Beacon } from '@imtbl/platform/src/contracts';
import { getSignedPayment, Currency, Order } from '@imtbl/platform';

import {
  ETHUSDMockOracle,
  getETHPayment,
} from '@imtbl/platform';

jest.setTimeout(600000);

const provider = new Ganache(Ganache.DefaultOptions);
const blockchain = new Blockchain(provider);
const MAX_MINT = 5;
const ZERO_EX = '0x0000000000000000000000000000000000000000';

ethers.errors.setLogLevel('error');

describe('EpicPack', () => {

  const [owner] = generatedWallets(provider);

  beforeEach(async () => {
    await blockchain.resetAsync();
    await blockchain.saveSnapshotAsync();
  });

  afterEach(async () => {
    await blockchain.revertAsync();
  });

  describe('deployment', () => {

    let beacon: Beacon;
    let referral: Referral;
    let processor: PurchaseProcessor;

    let raffle: Raffle;

    let escrow: Escrow;
    let cc: CreditCardEscrow;
    const sku = keccak256('0x00');

    beforeAll(async() => {
      escrow = await Escrow.deploy(owner);
      cc = await CreditCardEscrow.deploy(
        owner,
        escrow.address,
        ZERO_EX,
        100,
        ZERO_EX,
        100
      );
      beacon = await Beacon.deploy(owner);
      referral = await Referral.deploy(owner, 90, 10);
      processor = await PurchaseProcessor.deploy(owner, owner.address);
      raffle = await Raffle.deploy(owner);
    });

    it('should deploy epic pack', async () => {
      await EpicPack.deploy(
        owner,
        MAX_MINT,
        raffle.address,
        beacon.address, ZERO_EX, referral.address, sku,
        cc.address, processor.address
      );
    });

  });

  describe('purchase USD', () => {

    let beacon: Beacon;
    let referral: Referral;
    let processor: PurchaseProcessor;
    let raffle: Raffle;
    let oracle: ETHUSDMockOracle;

    let escrow: Escrow;
    let cc: CreditCardEscrow;
    const epicPackSKU = keccak256('0x00');
    let cards: Cards;

    let epic: EpicPack;
    const cost = 649;

    beforeEach(async() => {
      escrow = await Escrow.deploy(owner);
      cc = await CreditCardEscrow.deploy(
        owner,
        escrow.address,
        owner.address,
        100,
        owner.address,
        100
      );
      beacon = await Beacon.deploy(owner);
      referral = await Referral.deploy(owner, 90, 10);
      oracle = await ETHUSDMockOracle.deploy(owner);
      processor = await PurchaseProcessor.deploy(owner, owner.address);
      cards = await Cards.deploy(owner, 1250, 'Cards', 'CARD');
      raffle = await Raffle.deploy(owner);
      epic = await EpicPack.deploy(
        owner,
        MAX_MINT,
        raffle.address,
        beacon.address, cards.address, referral.address, epicPackSKU,
        cc.address, processor.address
      );
      await processor.setOracle(oracle.address);
      await processor.setSellerApproval(epic.address, [epicPackSKU], true);
      await processor.setSignerLimit(owner.address, 1000000000000000);
      await cards.startSeason("Season One", 800, 1000);
      await cards.addFactory(epic.address, 1);
      await raffle.setMinterApproval(epic.address, true);
    });

    async function purchasePacks(quantity: number) {
      const order: Order = {
        quantity, sku: epicPackSKU,
        assetRecipient: owner.address,
        changeRecipient: owner.address,
        alreadyPaid: 0,
        totalPrice: cost * quantity,
        currency: Currency.USDCents
      };
      const params = { escrowFor: 0, nonce: 0, value: cost * quantity };
      const payment = await getSignedPayment(
         owner, processor.address, epic.address, order, params
      );
      await epic.purchase(quantity, payment, ZERO_EX);
      for (let i = 0; i < quantity; i += MAX_MINT) {
        await epic.mint(0);
      }
    }

    it('should purchase max + 1 packs with USD', async () => {
      await purchasePacks(MAX_MINT + 1);
      // should have minted everything
      await expectRevert(epic.mint(0));
    });

    it('should purchase 2 * max + 1 packs with USD', async () => {
      await purchasePacks(2 * MAX_MINT + 1);
      // should have minted everything
      await expectRevert(epic.mint(0));
    });

  });

  describe('purchase ETH', () => {

    let beacon: Beacon;
    let referral: Referral;
    let oracle: ETHUSDMockOracle;
    let processor: PurchaseProcessor;
    let raffle: Raffle;
    let escrow: Escrow;
    let cc: CreditCardEscrow;
    const epicPackSKU = keccak256('0x00');
    let cards: Cards;
    const max_mint = 5;
    let epic: EpicPack;
    const cost = 649;

    beforeEach(async() => {
      escrow = await Escrow.deploy(owner);
      cc = await CreditCardEscrow.deploy(
        owner,
        escrow.address,
        owner.address,
        100,
        owner.address,
        100
      );
      beacon = await Beacon.deploy(owner);
      referral = await Referral.deploy(owner, 90, 10);
      oracle = await ETHUSDMockOracle.deploy(owner);
      processor = await PurchaseProcessor.deploy(owner, owner.address);
      cards = await Cards.deploy(owner, 1250, 'Cards', 'CARD');
      raffle = await Raffle.deploy(owner);
      epic = await EpicPack.deploy(
        owner,
        MAX_MINT,
        raffle.address,
        beacon.address, cards.address, referral.address, epicPackSKU,
        cc.address, processor.address
      );
      await cards.startSeason("Season One", 800, 1000);
      await cards.addFactory(epic.address, 1);
      await processor.setOracle(oracle.address);
      await processor.setSellerApproval(epic.address, [epicPackSKU], true);
      await processor.setSignerLimit(owner.address, 1000000000000000);
      await raffle.setMinterApproval(epic.address, true);
    });

    async function purchasePacks(quantity: number) {
      const payment = getETHPayment();
      const ethRequired = await oracle.convert(1, 0, cost * quantity);
      await epic.purchase(quantity, payment, ZERO_EX, { value: ethRequired });
      for (let i = 0; i < quantity; i += MAX_MINT) {
        await epic.mint(0);
      }
    }

    it('should purchase 6 with ETH', async () => {
      await purchasePacks(MAX_MINT + 1);
      // should have minted everything
      await expectRevert(epic.mint(0));
    });

    it('should purchase 11 with ETH', async () => {
      await purchasePacks(2 * MAX_MINT + 1);
      // should have minted everything
      await expectRevert(epic.mint(0));
    });

  });

});