import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { deployment } from "../helpers/fixture";
import { parseEther } from "../helpers/math";
import { advanceEpochs } from "../helpers/state-interaction";


describe("UNSTAKING CLAIM", () => {
  let TREASURY_INITIAL_DEPOSIT
  let one, two, three, token, stakeManager, staker, treasury;
  let withdrawalFee = 0.001;
  let reverseWithdrawalFee = 1 - withdrawalFee;
  let INITIAL_BALANCE;
  let userTokenBalance0;
  let userStakerBalance0;
  beforeEach(async () => {
        ({treasury, one, two, three, token, stakeManager, staker } = await loadFixture(deployment));
        INITIAL_BALANCE = await token.balanceOf(one.address);
    });

    describe("Single claim of direct withdrawal", async () => {
        let unbondNonce;
    
        beforeEach(async () => {
            await staker.connect(one).directDeposit(parseEther(10_000), one.address);
            userTokenBalance0 = await token.balanceOf(one.address);
            userStakerBalance0 = await staker.balanceOf(one.address);

            const tx  = await staker.connect(one).directWithdrawRequest(parseEther(3_000),one.address,one.address);
            await tx.wait();
            const events = await staker.queryFilter("UnbondNonceCreated", tx.blockNumber);
            unbondNonce = events[0].args._unbondNonce;
        });
    
        it("try claiming withdrawal requested 79 epochs ago", async () => {
            // advance by 79 epochs
            await advanceEpochs(stakeManager, 79);
        
            // test isClaimable returns false before 80 epochs have passed
            expect(await staker.isClaimable(unbondNonce)).to.equal(false);
        
            // try claiming with user treasury
            await expect(staker.connect(treasury).indirectUnstakeClaim(unbondNonce)).to.be.revertedWith("Incomplete withdrawal period");
        });
        
        it("try claiming withdrawal with unbond nonce that doesn't exist", async () => {
            // advance by 100 epochs
            await advanceEpochs(stakeManager, 100);
                
            await expect(staker.connect(treasury).indirectUnstakeClaim(unbondNonce + 1)).to.be.revertedWith("Incomplete withdrawal period");
        });
        
        it("try claiming already claimed withdrawal", async () => {
            // advance by 100 epochs
            await advanceEpochs(stakeManager, 100);
            
            // claim with user treasury
            await staker.connect(treasury).indirectUnstakeClaim(unbondNonce);
            
            // try claiming with user treasury
            await expect(staker.connect(treasury).indirectUnstakeClaim(unbondNonce)).to.be.revertedWith("Incomplete withdrawal period");
        });
    
        it("successfully claim withdrawal requested 80 epochs ago with expected changes in state and balances", async () => {

            // advance by 80 epochs
            await advanceEpochs(stakeManager, 80);
            expect(await staker.isClaimable(unbondNonce)).to.equal(true);
            await staker.connect(treasury).indirectUnstakeClaim(unbondNonce);
            expect(await staker.isClaimable(unbondNonce)).to.equal(false);

            expect(await token.balanceOf(one.address)).to.equal(userTokenBalance0.add(parseEther(3_000)));
            expect(await staker.balanceOf(one.address)).to.equal(userStakerBalance0.sub(parseEther(3_000)));
            
        });
    });

    describe("Multiple claims of direct withdrawals", async () => {
        let n1, n2, n3, n4;
        let user1TokenBalance, user1StakerBalance, user2TokenBalance, user2StakerBalance;
    
        beforeEach(async () => {
            // initiate four requests, with nonces n1, n2, n3, n4
            // each 10 epochs apart
        
            // deposit 1M MATIC
            await staker.connect(one).directDeposit(parseEther(1e6), one.address);
            await staker.connect(two).directDeposit(parseEther(1e6), two.address);

            user1TokenBalance = await token.balanceOf(one.address);
            user1StakerBalance = await staker.balanceOf(one.address);
            user2TokenBalance = await token.balanceOf(two.address);
            user2StakerBalance = await staker.balanceOf(two.address);
        
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
        });
    
        it("try to claim test unbonds when one has not matured", async () => {
            // advance epochs till n2 has matured
            await advanceEpochs(stakeManager, 60);
        
            expect(await staker.isClaimable(n1)).to.equal(true);
            expect(await staker.isClaimable(n2)).to.equal(true);
            expect(await staker.isClaimable(n3)).to.equal(false);
            expect(await staker.isClaimable(n4)).to.equal(false);
            await expect(staker.connect(treasury).indirectUnstakeClaim(n3)).to.be.revertedWith("Incomplete withdrawal period");
            await expect(staker.connect(treasury).indirectUnstakeClaim(n4)).to.be.revertedWith("Incomplete withdrawal period");
        });
    
    
        it("successfully claim all test unbonds in random order", async () => {
            await advanceEpochs(stakeManager, 80);
            await staker.connect(treasury).indirectUnstakeClaim(n4);
            await staker.connect(treasury).indirectUnstakeClaim(n1);
            await staker.connect(treasury).indirectUnstakeClaim(n3);
            await staker.connect(treasury).indirectUnstakeClaim(n2);

            expect(await token.balanceOf(one.address)).to.equal(user1TokenBalance.add(parseEther(111_000)));
            expect(await staker.balanceOf(one.address)).to.equal(user1StakerBalance.sub(parseEther(111_000)));
            expect(await token.balanceOf(two.address)).to.equal(user2TokenBalance.add(parseEther(10_000)));
            expect(await staker.balanceOf(two.address)).to.equal(user2StakerBalance.sub(parseEther(10_000)));
        });
    });

    describe("Claims of indirect withdrawals", async () => {
        beforeEach(async () => {
            await staker.connect(one).directDeposit(parseEther(1e6), one.address);
            await staker.connect(two).directDeposit(parseEther(1e6), two.address);
        });

        it("try claim combination of direct and indirect withdrawals", async () => {
            let treasuryTokenBalance, treasuryStakerBalance, user1TokenBalance, user1StakerBalance, user2TokenBalance, user2StakerBalance;
            treasuryTokenBalance = await token.balanceOf(treasury.address);
            treasuryStakerBalance = await staker.balanceOf(treasury.address);
            user1TokenBalance = await token.balanceOf(one.address);
            user1StakerBalance = await staker.balanceOf(one.address);
            user2TokenBalance = await token.balanceOf(two.address);
            user2StakerBalance = await staker.balanceOf(two.address);
            
            await staker.connect(one).indirectWithdrawRequest(parseEther(1_000), one.address, one.address);
            await staker.connect(one).indirectWithdrawRequest(parseEther(1_000), one.address, one.address);
            await staker.connect(one).indirectWithdrawRequest(parseEther(1_000), one.address, one.address);
            await staker.connect(two).indirectWithdrawRequest(parseEther(1_000), two.address, two.address);
            let totalIndirectWithdrawalAmount = 4_000;
            const tx  = await staker.connect(two).directWithdrawRequest(parseEther(1_000),two.address,two.address);
            await tx.wait();
            const events = await staker.queryFilter("UnbondNonceCreated", tx.blockNumber);
            let unbondNonce = events[0].args._unbondNonce;
            
            await advanceEpochs(stakeManager, 80);
            expect(await staker.isClaimable(unbondNonce)).to.equal(true);
            await staker.connect(treasury).indirectUnstakeClaim(unbondNonce);
            
            
            // treasury should have shares from the withdrawal fees of the indirect withdrawals
            expect(await token.balanceOf(treasury.address)).to.equal(treasuryTokenBalance);
            expect(await staker.balanceOf(treasury.address)).to.equal(treasuryStakerBalance.add(parseEther(totalIndirectWithdrawalAmount*withdrawalFee)));
            // user one should have receive an amount smaller than the requested amount due to the withdrawal fee
            expect(await token.balanceOf(one.address)).to.equal(user1TokenBalance.add(parseEther(3_000).sub(parseEther(3_000 * withdrawalFee))));
            // however the full requested amount should be subtracted from the staker balance
            expect(await staker.balanceOf(one.address)).to.equal(user1StakerBalance.sub(parseEther(3_000)));
            // user one should have receive an amount smaller than the requested amount due to the withdrawal fee but only for the direct withdrawal
            expect(await token.balanceOf(two.address)).to.equal(user1TokenBalance.add(parseEther(2_000).sub(parseEther(1_000 * withdrawalFee))));
            // however the full requested amount should be subtracted from the staker balance
            expect(await staker.balanceOf(two.address)).to.equal(user2StakerBalance.sub(parseEther(2_000)));
            
            
            let [globalSharePriceNumerator, globalSharePriceDenominator] = await staker.sharePrice();
            expect(globalSharePriceNumerator.div(globalSharePriceDenominator)).to.equal(parseEther(1));
        });
    });

});

