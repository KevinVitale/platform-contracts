import 'jest';

import { Blockchain, generatedWallets } from '@imtbl/test-utils';
import { 
  Escrow, EscrowFactory,
  Beacon, BeaconFactory,
  CreditCardEscrow, CreditCardEscrowFactory,
  Referral, ReferralFactory,
  RarePack, RarePackFactory,
  EpicPack, EpicPackFactory,
  LegendaryPack, LegendaryPackFactory,
  ShinyPack, ShinyPackFactory, CardsFactory, Cards, Pay, PayFactory,
} from '../../../src';
import { Wallet, ethers } from 'ethers';
import { keccak256 } from 'ethers/utils';

import { getSignedPayment, Currency } from '@imtbl/platform/src/pay';

jest.setTimeout(600000);

const provider = new ethers.providers.JsonRpcProvider();
const blockchain = new Blockchain();

const ZERO_EX = '0x0000000000000000000000000000000000000000';

describe('Referral', () => {

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
    let processor: Pay;

    let escrow: Escrow;
    let cc: CreditCardEscrow;
    let sku = keccak256('0x00');

    let rare: RarePack;
    let epic: EpicPack;
    let legendary: LegendaryPack;
    let shiny: ShinyPack;

    beforeEach(async() => {
        escrow = await new EscrowFactory(owner).deploy();
        cc = await new CreditCardEscrowFactory(owner).deploy(
            escrow.address,
            ZERO_EX, 
            100,
            ZERO_EX,
            100
        );
        beacon = await new BeaconFactory(owner).deploy();
        referral = await new ReferralFactory(owner).deploy();
        processor = await new PayFactory(owner).deploy();
    });

    it('should deploy rare pack', async () => {
        await new RarePackFactory(owner).deploy(
          beacon.address,
          ZERO_EX,
          sku, 
          referral.address,
          cc.address,
          processor.address
        );
    });

    it('should deploy epic pack', async () => {
        await new EpicPackFactory(owner).deploy(
          beacon.address,
          ZERO_EX,
          sku, 
          referral.address,
          cc.address,
          processor.address
        );
    });

    it('should deploy legendary pack', async () => {
        await new LegendaryPackFactory(owner).deploy(
          beacon.address,
          ZERO_EX,
          sku, 
          referral.address,
          cc.address,
          processor.address
        );
    });

    it('should deploy shiny pack', async () => {
        await new ShinyPackFactory(owner).deploy(
          beacon.address,
          ZERO_EX,
          sku, 
          referral.address,
          cc.address,
          processor.address
        );
    });

  });

  describe('purchase', () => {

    let beacon: Beacon;
    let referral: Referral;
    let pay: Pay;

    let escrow: Escrow;
    let cc: CreditCardEscrow;
    let rarePackSKU = keccak256('0x00');
    let cards: Cards;

    let rare: RarePack;
    let cost = 249;

    beforeEach(async() => {
      escrow = await new EscrowFactory(owner).deploy();
      cc = await new CreditCardEscrowFactory(owner).deploy(
          escrow.address,
          owner.address, 
          100,
          owner.address,
          100
      );
      beacon = await new BeaconFactory(owner).deploy();
      referral = await new ReferralFactory(owner).deploy();
      pay = await new PayFactory(owner).deploy();
      cards = await new CardsFactory(owner).deploy(1250, "Cards", "CARD");
      rare = await new RarePackFactory(owner).deploy(
        beacon.address,
        cards.address,
        rarePackSKU, 
        referral.address,
        cc.address,
        pay.address
      );
      await pay.setSellerApproval(rare.address, [rarePackSKU], true);
      await pay.setSignerLimit(owner.address, 1000000000000000);
    });

    async function purchasePacks(quantity: number) {
      let order = { quantity: quantity, sku: rarePackSKU, user: owner.address, totalPrice: cost * quantity, currency: Currency.USDCents };
      let params = { escrowFor: 0, nonce: 0, value: cost * quantity };
      let payment = await getSignedPayment(owner, pay.address, rare.address, order, params);
      await rare.purchase(quantity, ZERO_EX, payment)
    }

    it('should purchase one pack with USD', async () => {
      await purchasePacks(1);
    });

    it('should purchase five packs with USD', async () => {
      await purchasePacks(5);
    });

    it('should purchase 100 packs with USD', async () => {
      await purchasePacks(100);
    });
  
  });

  describe('createCards', () => {

    let beacon: Beacon;
    let referral: Referral;
    let pay: Pay;

    let escrow: Escrow;
    let cc: CreditCardEscrow;
    let rarePackSKU = keccak256('0x00');
    let cards: Cards;

    let rare: RarePack;
    let cost = 249;

    beforeEach(async() => {
      escrow = await new EscrowFactory(owner).deploy();
      cc = await new CreditCardEscrowFactory(owner).deploy(
        escrow.address, owner.address, 100, owner.address, 100
      );
      beacon = await new BeaconFactory(owner).deploy();
      referral = await new ReferralFactory(owner).deploy();
      pay = await new PayFactory(owner).deploy();
      cards = await new CardsFactory(owner).deploy(1250, "Cards", "CARD");
      rare = await new RarePackFactory(owner).deploy(
        beacon.address, cards.address, rarePackSKU, 
        referral.address, cc.address, pay.address
      );
      await pay.setSellerApproval(rare.address, [rarePackSKU], true);
      await pay.setSignerLimit(owner.address, 1000000000000000);
      await cards.startSeason("S1", 1, 10000);
      await cards.addFactory(rare.address, 1);
    });

    async function purchaseAndCallback(quantity: number, escrowFor: number) {
      let order = { quantity: quantity, sku: rarePackSKU, user: owner.address, totalPrice: cost * quantity, currency: Currency.USDCents };
      let params = { escrowFor: escrowFor, nonce: 0, value: cost * quantity };
      let payment = await getSignedPayment(owner, pay.address, rare.address, order, params);
      let tx = await rare.purchase(quantity, ZERO_EX, payment);
      let receipt = await tx.wait();
      await beacon.callback(receipt.blockNumber);
    }

    async function createCardsTrackGas(id: number, description: string) {
      let tx = await rare.createCards(id);
      let receipt = await tx.wait();
      console.log(description, receipt.gasUsed.toNumber());
    }

    it('should create cards from 1 pack', async () => {
      await purchaseAndCallback(1, 100);
      await rare.createCards(0);
    });

    it('should create cards from 5 packs', async () => {
      await purchaseAndCallback(5, 100);
      await rare.createCards(0);
    });

    it('should create cards from 1 packs with no escrow', async () => {
      await purchaseAndCallback(1, 0);
      await createCardsTrackGas(0, "1 pack no escrow");
    });

    it('should create cards from 6 packs with no escrow', async () => {
      await purchaseAndCallback(6, 0);
      await createCardsTrackGas(0, "6 packs no escrow");
    });
  
  });

});
