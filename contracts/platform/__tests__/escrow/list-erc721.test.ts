import 'jest';

import { Escrow, TestERC721Token, MaliciousListPack, TestListPack } from '../../src/contracts';

import { Ganache, Blockchain, expectRevert, generatedWallets } from '@imtbl/test-utils';
import { ethers } from 'ethers';

const provider = new Ganache(Ganache.DefaultOptions);
const blockchain = new Blockchain(provider);

ethers.errors.setLogLevel('error');

const ZERO_EX = '0x0000000000000000000000000000000000000000';

jest.setTimeout(10000);

describe('ListERC271Escrow', () => {
  const [user, other] = generatedWallets(provider);

  beforeEach(async () => {
    await blockchain.resetAsync();
    await blockchain.saveSnapshotAsync();
  });

  afterEach(async () => {
    await blockchain.revertAsync();
  });

  async function checkBalance(erc20: TestERC721Token, address: string, expected: number) {
    const balance = await erc20.balanceOf(address);
    expect(balance.toNumber()).toBe(expected);
  }

  describe('#constructor', () => {
    it('should be able to deploy the escrow contract', async () => {
      const escrow = await Escrow.deploy(user);
    });
  });

  describe('#escrow', () => {
    let escrow: Escrow;
    let erc721: TestERC721Token;

    beforeEach(async () => {
      escrow = await Escrow.deploy(user);
      erc721 = await TestERC721Token.deploy(user);
    });

    it('should be able to escrow', async () => {
      await erc721.mint(user.address, 1);
      await checkBalance(erc721, user.address, 1);
      await erc721.setApprovalForAll(escrow.address, true);
      const vault = {
        player: user.address,
        admin: user.address,
        asset: erc721.address,
        balance: 0,
        lowTokenID: 0,
        highTokenID: 0,
        tokenIDs: [0],
      };
      await escrow.escrow(vault, user.address);
    });

    it('should not be able to escrow no tokens', async () => {
      await erc721.mint(user.address, 1);
      await erc721.setApprovalForAll(escrow.address, true);
      const vault = {
        player: user.address,
        admin: user.address,
        asset: erc721.address,
        balance: 0,
        lowTokenID: 0,
        highTokenID: 0,
        tokenIDs: [],
      };
      await expectRevert(escrow.escrow(vault, user.address));
    });

    it('should not be able to escrow null asset', async () => {
      await erc721.mint(user.address, 1);
      await erc721.setApprovalForAll(escrow.address, true);
      const vault = {
        player: user.address,
        admin: user.address,
        asset: ZERO_EX,
        balance: 0,
        lowTokenID: 0,
        highTokenID: 0,
        tokenIDs: [0],
      };
      await expectRevert(escrow.escrow(vault, user.address));
    });

    it('should not be able to escrow null releaser', async () => {
      await erc721.mint(user.address, 1);
      await erc721.setApprovalForAll(escrow.address, true);
      const vault = {
        player: user.address,
        admin: ZERO_EX,
        asset: erc721.address,
        balance: 0,
        lowTokenID: 0,
        highTokenID: 0,
        tokenIDs: [0],
      };
      await expectRevert(escrow.escrow(vault, user.address));
    });

    it('should be able to escrow 10 tokens', async () => {
      const len = 10;
      const tokenIDs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      await erc721.mint(user.address, len);
      await checkBalance(erc721, user.address, len);
      await erc721.setApprovalForAll(escrow.address, true);
      const vault = {
        tokenIDs,
        player: user.address,
        admin: user.address,
        asset: erc721.address,
        balance: 0,
        lowTokenID: 0,
        highTokenID: 0,
      };
      await escrow.escrow(vault, user.address);
    });

    it('should not be able to escrow unapproved tokens', async () => {
      const len = 1;
      await erc721.mint(user.address, len);
      await checkBalance(erc721, user.address, len);
      const vault = {
        player: user.address,
        admin: user.address,
        asset: erc721.address,
        balance: 0,
        lowTokenID: 0,
        highTokenID: 0,
        tokenIDs: [0],
      };
      await expectRevert(escrow.escrow(vault, user.address));
    });

    it('should not be able to escrow unowned tokens', async () => {
      const len = 1;
      await erc721.mint(other.address, len);
      // TODO: change from address
      await erc721.setApprovalForAll(escrow.address, true);
      const vault = {
        player: user.address,
        admin: user.address,
        asset: erc721.address,
        balance: 0,
        lowTokenID: 0,
        highTokenID: 0,
        tokenIDs: [0],
      };
      await expectRevert(escrow.escrow(vault, user.address));
    });
  });

  describe('#release', () => {
    let escrow: Escrow;
    let erc721: TestERC721Token;

    beforeEach(async () => {
      escrow = await Escrow.deploy(user);
      erc721 = await TestERC721Token.deploy(user);
    });

    it('should not be able to release without being the releaser', async () => {
      await erc721.mint(user.address, 1);
      await erc721.setApprovalForAll(escrow.address, true);
      const vault = {
        player: user.address,
        admin: other.address,
        asset: erc721.address,
        balance: 0,
        lowTokenID: 0,
        highTokenID: 0,
        tokenIDs: [0],
      };
      await escrow.escrow(vault, user.address);
      await expectRevert(escrow.release(0, user.address));
    });

    it('should release correctly', async () => {
      await erc721.mint(user.address, 1);
      await checkBalance(erc721, user.address, 1);
      await checkBalance(erc721, escrow.address, 0);
      await erc721.setApprovalForAll(escrow.address, true);
      const vault = {
        player: user.address,
        admin: user.address,
        asset: erc721.address,
        balance: 0,
        lowTokenID: 0,
        highTokenID: 0,
        tokenIDs: [0],
      };
      await escrow.escrow(vault, user.address);
      await checkBalance(erc721, user.address, 0);
      await checkBalance(erc721, escrow.address, 1);
      await escrow.release(0, user.address);
      await checkBalance(erc721, user.address, 1);
      await checkBalance(erc721, escrow.address, 0);
    });
  });

  describe('#callbackEscrow', () => {
    let escrow: Escrow;
    let erc721: TestERC721Token;
    let malicious: MaliciousListPack;
    let pack: TestListPack;

    beforeEach(async () => {
      escrow = await Escrow.deploy(user);
      erc721 = await TestERC721Token.deploy(user);
      malicious = await MaliciousListPack.deploy(user, escrow.address, erc721.address);
      pack = await TestListPack.deploy(user, escrow.address, erc721.address);
    });

    it('should be able to create a vault using a callback', async () => {
      await pack.purchase(5);
    });

    it('should not be able to create a push escrow vault in the callback', async () => {
      await expectRevert(malicious.maliciousPush(5));
    });

    it('should not be able to create a pull escrow vault in the callback', async () => {
      await expectRevert(malicious.maliciousPull(5));
    });

    //   // TODO: tests for where the assets are already in escrow
  });
});
