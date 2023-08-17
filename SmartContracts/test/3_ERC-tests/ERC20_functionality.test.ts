import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { deployment } from "../helpers/fixture";
import { calculateTrsyWithdrawFees, calculateSharesFromAmount, parseEther } from "../helpers/math";
import { submitCheckpoint } from "../helpers/state-interaction";
import { advanceEpochs } from "../helpers/state-interaction";

describe("TruMATIC ERC20 Functionality", () => {
    let one, two, three, stakeManager, staker, treasury, phiPrecision,deployer;
    let name = "TruStake MATIC Vault Shares";
    let symbol = "TruMATIC";
    let TREASURY_INITIAL_DEPOSIT
    beforeEach(async () => {
      // reset to fixture
      ({ treasury, one, two, three, stakeManager, staker, deployer } = await loadFixture(deployment));
      TREASURY_INITIAL_DEPOSIT = parseEther(100); 
      await staker.connect(treasury).directDeposit(TREASURY_INITIAL_DEPOSIT, treasury.address);
    });
        it('has a name', async function () {
            expect(await staker.name()).to.equal(name);
        });
        
        it('has a symbol', async function () {
        expect(await staker.symbol()).to.equal(symbol);
        });

    describe("totalSupply",() => {
        let totalStaked, totalSupply;
        beforeEach(async () => {
          await staker.connect(one).directDeposit(parseEther(1000),one.address);
          await staker.connect(two).directDeposit(parseEther(1000),two.address);
          await staker.connect(three).directDeposit(parseEther(1000), three.address);
            totalStaked = await staker.totalStaked();
            totalSupply = await staker.totalSupply();
        });

          it("totalSupply equals totalStaked for first deposits", async function(){
          // after first deposits without rewards accrued, totalSupply should equal totalStaked
          expect(totalStaked).to.equal(totalSupply);
          });

          it("totalSupply is not altered by rewards accrual without deposit", async function() {
          // accrue rewards 
          await submitCheckpoint(0);
    
          // totalSupply should not have increased as no new shares are minted
          expect(await staker.totalSupply()).to.equal(totalSupply);
          });

          it("new deposit after reward accrual increases totalSupply",async function(){
          // accrue rewards
          await submitCheckpoint(0);

          // get rewards and new shareprice
          let totalRewards = await staker.totalRewards();
          const [globalSharePriceNumerator, globalSharePriceDenominator] = await staker.sharePrice();

          // deposit again to mint shares to treasury
          await staker.connect(one).directDeposit(parseEther(1000),one.address)
          const newAmtStakedInTruMATIC = calculateSharesFromAmount(parseEther(1000),[globalSharePriceNumerator, globalSharePriceDenominator]);
          const trsyShares = calculateTrsyWithdrawFees(totalRewards,[globalSharePriceNumerator, globalSharePriceDenominator]);

          // now, totalSupply should equal the previous amount staked plus the amount minted from new deposit plus fee shares minted to the treasury
          expect(await staker.totalSupply()).to.equal(totalSupply.add(newAmtStakedInTruMATIC).add(trsyShares));
          });

          it("withdraw requests pre accrual decrease totalSupply correctly", async function(){
            const withdrawAmount = parseEther(1000);

            // withdraw
            await staker.connect(one).directWithdrawRequest(withdrawAmount,one.address,one.address);
            await staker.connect(two).directWithdrawRequest(withdrawAmount,two.address,two.address);
            expect(await staker.totalSupply()).to.equal(withdrawAmount.add(TREASURY_INITIAL_DEPOSIT));
            expect(await staker.balanceOf(one.address)).to.equal(0);
            expect(await staker.balanceOf(two.address)).to.equal(0);
          });

          it("withdraw requests pre accrual alter totalSupply and user balance", async function(){
              const stakedAmount = parseEther(3000);
              const withdrawAmount = parseEther(1000);
              
              expect(await staker.balanceOf(one.address)).to.equal(parseEther(1000));
              expect(await staker.totalSupply()).to.equal(stakedAmount.add(TREASURY_INITIAL_DEPOSIT));
              
              // withdraw
              await staker.connect(one).directWithdrawRequest(withdrawAmount,one.address,one.address);
              
              expect(await staker.balanceOf(one.address)).to.equal(parseEther(1000).sub(withdrawAmount));
              expect(await staker.totalSupply()).to.equal(stakedAmount.add(TREASURY_INITIAL_DEPOSIT).sub(withdrawAmount));
            });

          it("withdraw requests post accrual decrease totalSupply correctly", async function(){
            const withdrawAmount = parseEther(1000);
            // ACCRUE
            await submitCheckpoint(0);

            // Get rewards & new share price
            let totalRewards = await staker.totalRewards();
            const [globalSharePriceNumerator, globalSharePriceDenominator] = await staker.sharePrice();

            // Withdraw user 1
            await staker.connect(one).directWithdrawRequest(withdrawAmount,one.address,one.address);

            // Treasury Shares
            const trsyShares = calculateTrsyWithdrawFees(totalRewards,[globalSharePriceNumerator,globalSharePriceDenominator])
        
            await staker.connect(two).directWithdrawRequest(withdrawAmount,two.address,two.address);
            // expect the new totalSupply to be treasury deposit amount + user3 amount left + shares minted to treasury
            expect(await staker.totalSupply()).to.equal(TREASURY_INITIAL_DEPOSIT.add(withdrawAmount).add(trsyShares));
        });


    });

    describe("balanceOf",() => {
        it("correctly updates balances post deposit",async function() {
            expect(await staker.balanceOf(one.address)).to.equal(0);
            await staker.connect(one).directDeposit(parseEther(2000),one.address);
            expect(await staker.balanceOf(one.address)).to.equal(parseEther(2000));
        });

        it("correctly updates sharePrice post reward accrual",async function() {
            await staker.connect(one).directDeposit(parseEther(2000),one.address);
            let [globalSharePriceNumerator, globalSharePriceDenominator] = await staker.sharePrice();
            expect(globalSharePriceNumerator.div(globalSharePriceDenominator)).to.equal(parseEther(1));
            
            // accrue rewards
            await submitCheckpoint(0);
            [globalSharePriceNumerator, globalSharePriceDenominator] = await staker.sharePrice();
            expect(globalSharePriceNumerator.div(globalSharePriceDenominator)).to.be.gt(parseEther(1))
        });
    });

    describe("transfer", () => {
      it("correctly transfers post deposit", async function () {
        // deposit
        await staker.connect(one).directDeposit(parseEther(2000), one.address);

        // check TruMATIC balances
        expect(await staker.balanceOf(two.address)).to.equal(0);
        expect(await staker.balanceOf(one.address)).to.equal(parseEther(2000));

        // attempt to transfer TruMATIC
        await staker.connect(one).transfer(two.address, parseEther(1000));

        // check TruMATIC was transferred 
        expect(await staker.balanceOf(two.address)).to.equal(parseEther(1000));
        expect(await staker.balanceOf(one.address)).to.equal(parseEther(1000));
      });

        it("Reverts with custom error if more than users balance is transferred",async function() {
            // override beforetokentransfer function 
            await expect(staker.connect(one).transfer(two.address,parseEther(2000))).to.be.revertedWithCustomError(staker,"ExceedsUnallocatedBalance");
        });
    });

    describe("transferFrom", () => {
      const allowance = parseEther(2000);

      it("Reverts without allowance/with insufficient balance", async function () {
        await expect(staker.connect(two).transferFrom(one.address, two.address, allowance)).to.be.revertedWith(
          "ERC20: insufficient allowance"
        );
        await staker.connect(one).approve(two.address, allowance);

        // user has no TruMATIC so this should also revert
        await expect(
          staker.connect(two).transferFrom(one.address, two.address, allowance)
        ).to.be.revertedWithCustomError(staker, "ExceedsUnallocatedBalance");
      });

      it("transferFrom after deposit works", async function () {
        // deposit
        await staker.connect(one).directDeposit(allowance.mul(2), one.address);

        // approve
        await staker.connect(one).approve(two.address, allowance);

        // transferFrom works and balances/allowance are updated
        await staker.connect(two).transferFrom(one.address, two.address, allowance);
        expect(await staker.allowance(one.address, two.address)).to.equal(0);
        expect(await staker.balanceOf(one.address)).to.equal(allowance);
        expect(await staker.balanceOf(two.address)).to.equal(allowance);
      });

    });

    describe("Share Price", () => {
      it("direct deposit and withdrawal should not affect share price", async function () {
        let [globalSharePriceNumerator0, globalSharePriceDenominator0] = await staker.sharePrice();
        // deposit
        await staker.connect(one).directDeposit(parseEther(1000), one.address);
        let [globalSharePriceNumerator1, globalSharePriceDenominator1] = await staker.sharePrice();
        expect(globalSharePriceNumerator0.div(globalSharePriceDenominator0)).to.equal(globalSharePriceNumerator1.div(globalSharePriceDenominator1));
        expect(globalSharePriceNumerator1.div(globalSharePriceDenominator1)).to.equal(parseEther(1));
        
        await staker.connect(one).directWithdrawRequest(parseEther(500),one.address,one.address);
        let [globalSharePriceNumerator2, globalSharePriceDenominator2] = await staker.sharePrice();
        expect(globalSharePriceNumerator0.div(globalSharePriceDenominator0)).to.equal(globalSharePriceNumerator2.div(globalSharePriceDenominator2));
        expect(globalSharePriceNumerator2.div(globalSharePriceDenominator2)).to.equal(parseEther(1));
      });

      it("deposits should not affect share price", async function () {
        await staker.connect(one).indirectDeposit(parseEther(2000), one.address);
        await staker.connect(two).directDeposit(parseEther(2000), two.address);
        await staker.connect(one).indirectDeposit(parseEther(2000), one.address);
        await staker.connect(two).directDeposit(parseEther(2000), two.address);
        await staker.connect(two).indirectDeposit(parseEther(2000), two.address);
        await staker.connect(one).indirectDeposit(parseEther(2000), one.address);
        
        let [globalSharePriceNumerator, globalSharePriceDenominator] = await staker.sharePrice();
        expect(globalSharePriceNumerator.div(globalSharePriceDenominator)).to.equal(parseEther(1));
      });
      
      it("withdrawals should not affect share price", async function () {
        await staker.connect(one).directDeposit(parseEther(20000), one.address);
        
        await staker.connect(one).indirectWithdrawRequest(parseEther(500),one.address,one.address);
        await staker.connect(one).directWithdrawRequest(parseEther(500),one.address,one.address);
        await staker.connect(one).indirectWithdrawRequest(parseEther(500),one.address,one.address);
        await staker.connect(one).directWithdrawRequest(parseEther(500),one.address,one.address);
        await staker.connect(one).indirectWithdrawRequest(parseEther(500),one.address,one.address);
        
        let [globalSharePriceNumerator, globalSharePriceDenominator] = await staker.sharePrice();
        expect(globalSharePriceNumerator.div(globalSharePriceDenominator)).to.equal(parseEther(1));
      });
      
      it("deposits and withdrawals post accrual should not affect share price", async function () {
        await submitCheckpoint(0);
        let [globalSharePriceNumerator0, globalSharePriceDenominator0] = await staker.sharePrice();
        await staker.connect(one).directDeposit(parseEther(20000), one.address);
        await staker.connect(one).indirectDeposit(parseEther(20000), one.address);
        let [globalSharePriceNumerator, globalSharePriceDenominator] = await staker.sharePrice();
        expect(globalSharePriceNumerator.div(globalSharePriceDenominator)).to.equal(globalSharePriceNumerator0.div(globalSharePriceDenominator0));
        
        await submitCheckpoint(1);
        [globalSharePriceNumerator0, globalSharePriceDenominator0] = await staker.sharePrice();
        await staker.connect(one).indirectDeposit(parseEther(20000), one.address);
        await staker.connect(one).directDeposit(parseEther(20000), one.address);
        [globalSharePriceNumerator, globalSharePriceDenominator] = await staker.sharePrice();
        expect(globalSharePriceNumerator.div(globalSharePriceDenominator)).to.equal(globalSharePriceNumerator0.div(globalSharePriceDenominator0));
      });
      
      it("withdrawals post accrual should not affect share price", async function () {
        await submitCheckpoint(0);
        let [globalSharePriceNumerator0, globalSharePriceDenominator0] = await staker.sharePrice();
        await staker.connect(one).directDeposit(parseEther(2000), one.address);
        await staker.connect(one).directWithdrawRequest(parseEther(1000),one.address,one.address);
        let [globalSharePriceNumerator, globalSharePriceDenominator] = await staker.sharePrice();
        expect(globalSharePriceNumerator.div(globalSharePriceDenominator)).to.equal(globalSharePriceNumerator0.div(globalSharePriceDenominator0));
        
        await submitCheckpoint(1);
        [globalSharePriceNumerator0, globalSharePriceDenominator0] = await staker.sharePrice();
        await staker.connect(one).directWithdrawRequest(parseEther(500),one.address,one.address);
        await staker.connect(one).indirectWithdrawRequest(parseEther(500),one.address,one.address);
        [globalSharePriceNumerator, globalSharePriceDenominator] = await staker.sharePrice();
        expect(globalSharePriceNumerator.div(globalSharePriceDenominator)).to.equal(globalSharePriceNumerator0.div(globalSharePriceDenominator0));
      });

      it("netting post accrual should not affect share price", async function () {
        let userInitialDeposit = parseEther(50_000);
        let depositFee = 0.001;
        let withdrawalFee = 0.001;
        await staker.connect(treasury).directDeposit(TREASURY_INITIAL_DEPOSIT, treasury.address);
        await staker.connect(one).directDeposit(userInitialDeposit, one.address);
        await submitCheckpoint(0);
        let [globalSharePriceNumerator0, globalSharePriceDenominator0] = await staker.sharePrice();

        let nettingAmount = parseEther(1_000);
        await staker.connect(one).indirectWithdrawRequest(nettingAmount,one.address,one.address);
        await staker.connect(two).indirectDeposit(nettingAmount, two.address);

        expect(await staker.toAssets(await staker.balanceOf(one.address))).to.be.greaterThan(userInitialDeposit.sub(nettingAmount));
        expect((await staker.toAssets(await staker.balanceOf(two.address))).sub(nettingAmount)).to.be.lessThan(1000);
        expect(await staker.toAssets(await staker.balanceOf(treasury.address))).to.be.greaterThan(TREASURY_INITIAL_DEPOSIT.add(parseEther(1_000 * depositFee)).add(parseEther(1_000 * withdrawalFee)));

        expect(await staker.getUserPreshares(one.address)).to.equal(parseEther(0));

        
        expect(await staker.dQueueBalance()).to.equal(parseEther(0));
        expect(await staker.wQueueBalance()).to.equal(parseEther(0));
        let [globalSharePriceNumerator, globalSharePriceDenominator] = await staker.sharePrice();
        expect(globalSharePriceNumerator.div(globalSharePriceDenominator)).to.equal(globalSharePriceNumerator0.div(globalSharePriceDenominator0));
    });

    it("claiming post accrual should not affect share price", async function () {
      let n1, n2, n3, n4;
      await staker.connect(one).directDeposit(parseEther(1e6), one.address);
      await staker.connect(two).directDeposit(parseEther(1e6), two.address);

      await submitCheckpoint(0);
      let [globalSharePriceNumerator0, globalSharePriceDenominator0] = await staker.sharePrice();

      // initiate withdrawals, inc. epoch between each
      await staker.connect(one).directWithdrawRequest(parseEther(10_000), one.address, one.address); // n1
      await advanceEpochs(stakeManager, 10);
      await staker.connect(one).directWithdrawRequest(parseEther(1_000), one.address, one.address); // n2
      await advanceEpochs(stakeManager, 10);
      await staker.connect(one).directWithdrawRequest(parseEther(100_000), one.address, one.address); // n3
      await advanceEpochs(stakeManager, 10);
      await staker.connect(two).directWithdrawRequest(parseEther(10_000), two.address, two.address); // n4
  
      // save unbond nonces for tests
      n4 = await staker.latestUnbondingNonce();
      n3 = n4.sub(1);
      n2 = n3.sub(1);
      n1 = n2.sub(1);

      await advanceEpochs(stakeManager, 80);
      await staker.connect(treasury).indirectUnstakeClaim(n4);
      await staker.connect(treasury).indirectUnstakeClaim(n1);
      await staker.connect(treasury).indirectUnstakeClaim(n3);
      await staker.connect(treasury).indirectUnstakeClaim(n2);

      let [globalSharePriceNumerator, globalSharePriceDenominator] = await staker.sharePrice();
      expect(globalSharePriceNumerator.div(globalSharePriceDenominator)).to.equal(globalSharePriceNumerator0.div(globalSharePriceDenominator0));
    });
  });

});
