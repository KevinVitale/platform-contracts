import { Address } from '@imtbl/common-types';
import { GenericAsset } from './../../src/contracts';
import 'jest';

jest.setTimeout(30000);

import { Blockchain, expectRevert, generatedWallets } from '@imtbl/test-utils';
import { Wallet, ethers } from 'ethers';

ethers.errors.setLogLevel('error');

import ganache from 'ganache-core';
const gp = ganache.provider({
  total_accounts: 20,
  gasLimit: 19000000,
  mnemonic: 'concert load couple harbor equip island argue ramp clarify fence smart topic',
  default_balance_ether: 10000000000
});

const provider = new ethers.providers.Web3Provider(gp as any);
const blockchain = new Blockchain(provider);

describe('Generic Asset', () => {
  const [ownerWallet, minterWallet, userWallet, userWallet2, userWallet3] = generatedWallets(
    provider,
  );

  beforeEach(async () => {
    await blockchain.resetAsync();
    await blockchain.saveSnapshotAsync();
  });

  afterEach(async () => {
    await blockchain.revertAsync();
  });

  describe('#setMinterStatus', () => {
    let genericAsset: GenericAsset;
    let callerWallet: Wallet;
    let callerMinter: Address;
    let callerStatus: boolean;

    beforeEach(async () => {
      callerMinter = minterWallet.address;
      callerWallet = ownerWallet;
      callerStatus = true;
      genericAsset = await GenericAsset.deploy(ownerWallet, 'GU: Asset', 'GU');
    });

    async function subject() {
      const contract = GenericAsset.at(callerWallet, genericAsset.address);
      await contract.setMinterStatus(callerMinter, callerStatus);
    }

    it('should not be able set minters as an unauthorised user', async () => {
      callerWallet = userWallet;
      await expectRevert(subject());
    });

    it('should be able to set minters as the owner', async () => {
      await subject();
      const minterStatus = await genericAsset.approvedMinters(minterWallet.address);
      expect(minterStatus).toBeTruthy();
    });
    it('should be able to remove minters as the owner', async () => {
      callerStatus = false;
      await subject();
      const minterStatus = await genericAsset.approvedMinters(minterWallet.address);
      expect(minterStatus).toBeFalsy();
    });
  });

  describe('#setTradabilityStatus', () => {
    let genericAsset: GenericAsset;
    let callerWallet: Wallet;
    let callerStatus: boolean;

    beforeEach(async () => {
      callerWallet = ownerWallet;
      callerStatus = true;
      genericAsset = await GenericAsset.deploy(ownerWallet, 'GU: Asset', 'GU');
    });

    async function subject() {
      const contract = GenericAsset.at(callerWallet, genericAsset.address);
      const tx = await contract.setTradabilityStatus(callerStatus);
      return tx.wait();
    }

    it('should not be able to set trading status an unauthorised user', async () => {
      callerWallet = userWallet;
      await expectRevert(subject());
    });

    it('should not be able to set trading status as the minter', async () => {
      callerWallet = minterWallet;
      await expectRevert(subject());
    });

    it('should be able to set trading status as the owner', async () => {
      callerWallet = ownerWallet;
      await subject();
      const tradingStatus = await genericAsset.isTradable();
      expect(tradingStatus).toBeTruthy();
    });
  });
});
