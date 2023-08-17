/** Testing initializing, modifiers, setters, and getters of the TruStakeMATIC vault. */

import { AddressZero } from "@ethersproject/constants";
import {
  impersonateAccount,
  loadFixture,
  stopImpersonatingAccount
} from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers, upgrades } from "hardhat";
import * as constants from "../helpers/constants";
import { deployment } from "../helpers/fixture";
import { parseEther, sharePriceEquality } from "../helpers/math";

describe("INIT", () => {
  let deployer, treasury, one, two, three, // accounts
    token, validatorShare, stakeManager, staker; // contracts

  beforeEach(async () => {
    // reset to fixture
    ({
      deployer, treasury, one, two, three,
      token, validatorShare, stakeManager, staker
    } = await loadFixture(deployment));
  });

  describe("INITIALISATION", () => {
    it("global variables initialised with correct values", async () => {
      expect(await staker.totalStaked()).to.equal(0);
      expect(await staker.totalRewards()).to.equal(0);
      expect(await staker.sharePrice()).to.eql([
        parseEther(1),
        BigNumber.from(1),
      ]);
      // todo: update this with new/all global vars
    });

    it("validating initializer parameters", async () => {
      await expect(
        ethers.getContractFactory("TruStakeMATICv2").then(
          (stakerFactory) => upgrades.deployProxy(stakerFactory, [
            token.address,
            stakeManager.address,
            validatorShare.address,
            treasury.address,
            constants.PHI_PRECISION.add(1),
            constants.CAP,
            constants.DEPOSIT_FEE,
            constants.WITHDRAWAL_FEE,
            constants.MIN_DEPOSIT_AMOUNT,
            constants.MIN_WITHDRAWAL_AMOUNT,
            constants.EXPIRY_PERIOD,
            constants.D_QUEUE_THRESHOLD,
            constants.W_QUEUE_THRESHOLD,
          ])
        )
      ).to.be.revertedWithCustomError(staker, "PhiTooLarge");
    });
  });

  describe("SETTERS", () => {
    it("setValidatorShareContract", async () => {
      let cap = parseEther(1_000_000);
      let depositFee = 20;                   
      let withdrawalFee = 20;                
      let minDepositAmount = parseEther(5);     
      let minWithdrawalAmount = parseEther(5);  
      let expiryPeriod = 2 * 86400;          
      let dQueueThreshold = parseEther(50);    
      let wQueueThreshold = parseEther(50);   
      
      expect(await staker.cap()).to.equal(parseEther(1e10));
      expect(await staker.depositFee()).to.equal(10);
      expect(await staker.withdrawalFee()).to.equal(10);
      expect(await staker.minDepositAmount()).to.equal(parseEther(100));
      expect(await staker.minWithdrawalAmount()).to.equal(parseEther(100));
      expect(await staker.expiryPeriod()).to.equal(7 * 86400);
      expect(await staker.dQueueThreshold()).to.equal(parseEther(15000));
      expect(await staker.wQueueThreshold()).to.equal(parseEther(15000));
      
      await expect(
        staker.connect(one).indirectDeposit(parseEther(10), one.address)
        ).to.be.revertedWithCustomError(staker, "DepositUnderMinDirectDepositAmount");
        await staker.connect(deployer).setParameters(cap, depositFee, withdrawalFee, minDepositAmount, minWithdrawalAmount, expiryPeriod, dQueueThreshold, wQueueThreshold);
        await staker.connect(one).indirectDeposit(parseEther(10), one.address);
        
      expect(await staker.cap()).to.equal(parseEther(1e6));
      expect(await staker.depositFee()).to.equal(20);
      expect(await staker.withdrawalFee()).to.equal(20);
      expect(await staker.minDepositAmount()).to.equal(parseEther(5));
      expect(await staker.minWithdrawalAmount()).to.equal(parseEther(5));
      expect(await staker.expiryPeriod()).to.equal(2 * 86400);
      expect(await staker.dQueueThreshold()).to.equal(parseEther(50));
      expect(await staker.wQueueThreshold()).to.equal(parseEther(50));
    });
  });

  describe("ATTACKS", () => {
    it("inflation frontrunning attack investigation", async () => {
      // Not really testing anything as the first transaction will not work (a min. of 1 MATIC
      // has now been added on deposits), but if this is run on a version of the stker contract
      // without this requirement, it can show what share price is inflated to based on different
      // initial deposit amounts.

      // Attack Description:
      // - first (malicious) user deposits 1 wei of MATIC, receives 1 wei of shares
      // - second (malicious) user (probably could be same as first) sends 10k MATIC
      //   directly to the vault, inflating the price from 1.0 to the extreme value of 1.0e22
      // - now, the next (legitimate) users who deposit 199999 MATIC will only receive
      //   1 wei of shares

      // Investigation Results:
      // - In the case of a first deposit of 1 wei, a 10k transfer will inflate the price to
      //   1e22 MATIC/TruMATIC.
      // - In the case of a 1 MATIC first deposit, it will inflate it to 1e4 MATIC/TruMATIC,
      //   which is expected.

      // Test Description:
      // one deposits 1 wei (check balances and share price)
      // two sends 10ke18 wei (check balances)
      // check that share price isn't crazy -- if it is, the contract must be changed

      const initSharePrice: [BigNumber, BigNumber] = [BigNumber.from(10).pow(18), BigNumber.from(1)];
      const depositAmount = parseEther(1); // BigNumber.from(1);

      // check initial share price and balances are zero-values
      expect(sharePriceEquality(await staker.sharePrice(), initSharePrice)).to.equal(true);
      expect(await staker.balanceOf(one.address)).to.equal(BigNumber.from(0)); // malicious user
      expect(await staker.balanceOf(two.address)).to.equal(BigNumber.from(0)); // malicious user
      expect(await staker.balanceOf(three.address)).to.equal(BigNumber.from(0)); // legitimate user

      // deposit 1 wei as first malicious user (one)
      // await staker.connect(one).deposit(BigNumber.from(1), one.address);
      await staker.connect(one).deposit(depositAmount, one.address);

      // check new share price and balances are as expected
      expect(sharePriceEquality(await staker.sharePrice(), initSharePrice)).to.equal(true); // unchanged
      expect(await staker.balanceOf(one.address)).to.equal(depositAmount); // changed
      expect(await staker.balanceOf(two.address)).to.equal(BigNumber.from(0)); // unchanged
      expect(await staker.balanceOf(three.address)).to.equal(BigNumber.from(0)); // unchanged

      // send 10k matic as second malicious user (two)
      await token.connect(two).transfer(staker.address, parseEther(10000));

      // log new share price and balances

      // console.log(await staker.sharePrice());
      // console.log(await staker.balanceOf(one.address));
      // console.log(await staker.balanceOf(two.address));
      // console.log(await staker.balanceOf(three.address));

      // when depositAmount is 1 wei: price goes up to ~1e40, which equals 1e22 MATIC for 1 TruMATIC
      // when depositAmount is 1 MATIC: price goes up to ~1e22, which equals 1e4 MATIC for 1 TruMATIC
      // this means the min. deposit to get a share is 1e4 wei, which equals 1e-14 MATIC, which is
      // small enough to not cause problems
    });

    // -------------------------- <v3> ---------------------------
    it("fail: directly depositing under 1 matic", async () => {
      // try depositing 1 wei
      await expect(
        staker.connect(one).directDeposit(BigNumber.from(1), one.address)
      ).to.be.revertedWithCustomError(staker, "DepositUnderOneMATIC");

      // try depositing 1e18 - 1 wei
      await expect(
        staker.connect(one).directDeposit(parseEther(1).sub(BigNumber.from(1)), one.address)
      ).to.be.revertedWithCustomError(staker, "DepositUnderOneMATIC");
    });

    it("fail: indirectly depositing under the minimum deposit amount", async () => {
      // try depositing 10 wei
      await expect(
        staker.connect(one).indirectDeposit(BigNumber.from(10), one.address)
      ).to.be.revertedWithCustomError(staker, "DepositUnderMinDirectDepositAmount");
    });

    it("pass: successfully directly deposit 1 matic or more", async () => {
      await staker.connect(one).directDeposit(parseEther(1), one.address);
      
      await staker.connect(one).directDeposit(parseEther(1).add(BigNumber.from(1)), one.address);
    });
    
    it("pass: successfully indirectly deposit 110 matic or more", async () => {
      await staker.connect(one).indirectDeposit(parseEther(110), one.address);
      await staker.connect(one).indirectDeposit(parseEther(110).add(BigNumber.from(1)), one.address);
    });
    
    
    it("fail: directly withdrawing more than deposit amount", async () => {
      await staker.connect(one).directDeposit(parseEther(1), one.address);
      await expect(
        staker.connect(one).directWithdrawRequest(parseEther(2), one.address, one.address)
      ).to.be.revertedWithCustomError(staker, "WithdrawalAmountTooLarge");
    });

    it("fail: indirectly withdrawing more than deposit amount", async () => {
      await staker.connect(one).directDeposit(parseEther(100), one.address);
      await expect(
        staker.connect(one).indirectWithdrawRequest(parseEther(101), one.address, one.address)
      ).to.be.revertedWithCustomError(staker, "WithdrawalAmountTooLarge");
    });

    it("fail: indirectly withdrawing more than the minimum withdrawal amount", async () => {
      await staker.connect(one).directDeposit(parseEther(100), one.address);
      await expect(
        staker.connect(one).indirectWithdrawRequest(parseEther(1).sub(BigNumber.from(1)), one.address, one.address)
      ).to.be.revertedWithCustomError(staker, "DirectWithdrawalRequestAmountBelowMin");
    });

    it("pass: successfully directly withdrawing 1 MATIC", async () => {
      await staker.connect(treasury).directDeposit(parseEther(1), treasury.address);
      await staker.connect(one).directDeposit(parseEther(1), one.address);
      await staker.connect(one).directWithdrawRequest(parseEther(1), one.address, one.address);
    });
    
    it("pass: successfully indirectly withdrawing 1 MATIC", async () => {
      await staker.connect(treasury).directDeposit(parseEther(1), treasury.address);
      await staker.connect(one).directDeposit(parseEther(100), one.address);
      await staker.connect(one).indirectWithdrawRequest(parseEther(100), one.address, one.address);
    });
    // -------------------------- </v3> --------------------------
  });

  describe("ERC-4626: getters + metadata", async () => {
    it("name", async () => {
      expect(await staker.name()).to.equal(constants.NAME);
    });
    
    it("symbol", async () => {
      expect(await staker.symbol()).to.equal(constants.SYMBOL);
    });
  });
});
