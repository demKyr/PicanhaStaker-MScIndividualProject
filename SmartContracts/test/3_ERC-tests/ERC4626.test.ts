import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { deployment } from "../helpers/fixture";
import { parseEther } from "../helpers/math";
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("ERC-4626", () => {
  // Accounts
  let depositor, receiver, staker, MATIC, deployer;

  // Test constants
  const DEPOSIT = parseEther(5000);
  const WITHDRAWAL = parseEther(500);

  beforeEach(async () => {
    ({ one: depositor, two: receiver, staker, token: MATIC, deployer } = await loadFixture(deployment));
  });

  describe("deposit", () => {
    // Standard specifies the deposit call must "revert if all of assets cannot be deposited"
    it("should revert if receiver is not caller ", async () => {
      await expect(staker.connect(depositor).directDeposit(DEPOSIT, receiver.address)).to.be.revertedWithCustomError(
        staker,
        "SenderAndOwnerMustBeReceiver"
      );
    });

    it("should mint fresh shares to depositor", async () => {
      // deposit
      await staker.connect(depositor).directDeposit(DEPOSIT, depositor.address);

      // Shares minted at a price of one, so number of shares minted equals DEPOSIT
      expect(await staker.totalSupply()).to.equal(DEPOSIT);

      // Check depositor owns ALL minted shares
      expect(await staker.balanceOf(depositor.address)).to.equal(DEPOSIT);
    });

    // Skipped due to issue #121
    it.skip("should increase vault assets by deposited MATIC", async () => {
      const initialDepositorMATICBalance = await MATIC.balanceOf(depositor.address);
      
      // deposit
      await staker.connect(depositor).directDeposit(DEPOSIT, depositor.address);
      
      const finalDepositorMATICBalance = await MATIC.balanceOf(depositor.address);

      // Check assets in vault equal to MATIC sent to vault
      expect(await staker.totalAssets()).to.equal(initialDepositorMATICBalance.sub(finalDepositorMATICBalance));
    });
  });

  describe("withdraw", () => {
    beforeEach(async () => {
      // Deposit at a share price of one
      await staker.connect(depositor).directDeposit(DEPOSIT, depositor.address);
    });

    it("should burn shares from withdrawer", async () => {
      // Check withdrawn shares are burned
      await expect(
        staker.connect(depositor).directWithdrawRequest(WITHDRAWAL, depositor.address, depositor.address)
      ).to.changeTokenBalance(staker, depositor, WITHDRAWAL.mul(-1));
    });
  });

});
