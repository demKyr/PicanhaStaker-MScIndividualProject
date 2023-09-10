import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { deployment } from "../helpers/fixture";
import { parseEther } from "../helpers/math";

describe("NETTING", () => {
  let TREASURY_INITIAL_DEPOSIT
  let one, two, three, staker, treasury, phiPrecision, deployer;
  let depositFee = 0.001;
  let withdrawalFee = 0.001;
  let userInitialDeposit = parseEther(50_000);
  beforeEach(async () => {
  // reset to fixture

    ({ treasury, one, two, three, staker, deployer } = await loadFixture(deployment));
    TREASURY_INITIAL_DEPOSIT = parseEther(100); 
    await staker.connect(treasury).directDeposit(TREASURY_INITIAL_DEPOSIT, treasury.address);
    await staker.connect(one).directDeposit(userInitialDeposit, one.address);
    });

    describe("Netting single requests",() => {
        it("Correctly net requests of same value", async function(){
            let [globalSharePriceNumerator0, globalSharePriceDenominator0] = await staker.sharePrice();
            let nettingAmount = parseEther(1_000);
            let partialNettingAmount = parseEther(500);

            await staker.connect(one).indirectWithdrawRequest(partialNettingAmount,one.address,one.address);
            await staker.connect(two).indirectDeposit(partialNettingAmount, two.address);
            await staker.connect(two).indirectDeposit(partialNettingAmount, two.address);
            await staker.connect(one).indirectWithdrawRequest(partialNettingAmount,one.address,one.address);

            expect(await staker.balanceOf(one.address)).to.equal(userInitialDeposit.sub(nettingAmount));
            expect(await staker.balanceOf(two.address)).to.equal(nettingAmount);
            expect(await staker.balanceOf(treasury.address)).to.equal(TREASURY_INITIAL_DEPOSIT.add(parseEther(1_000 * depositFee)).add(parseEther(1_000 * withdrawalFee)));

            expect(await staker.getUserPreshares(two.address)).to.equal(parseEther(0));
            
            expect(await staker.dQueueBalance()).to.equal(parseEther(0));
            expect(await staker.wQueueBalance()).to.equal(parseEther(0));

            let [globalSharePriceNumerator, globalSharePriceDenominator] = await staker.sharePrice();
            expect(globalSharePriceNumerator.div(globalSharePriceDenominator)).to.equal(globalSharePriceNumerator0.div(globalSharePriceDenominator0));
        });
        
        it("Correctly net requests with larger deposit amount", async function(){
            let nettingAmount = parseEther(1_000);
            let largerAmount = parseEther(1_500);

            await staker.connect(two).indirectDeposit(largerAmount, two.address);
            await staker.connect(one).indirectWithdrawRequest(nettingAmount,one.address,one.address);

            expect(await staker.balanceOf(one.address)).to.equal(userInitialDeposit.sub(nettingAmount));
            expect(await staker.balanceOf(two.address)).to.equal(nettingAmount);
            // all fees are collected as deposit fees are collected in advance and withdrawal fees are collected when the request is processed
            expect(await staker.balanceOf(treasury.address)).to.equal(TREASURY_INITIAL_DEPOSIT.add(parseEther(1_500 * depositFee)).add(parseEther(1_000 * withdrawalFee)));

            expect(await staker.getUserPreshares(two.address)).to.equal(parseEther(500));
            
            expect(await staker.dQueueBalance()).to.equal(parseEther(500));
            expect(await staker.wQueueBalance()).to.equal(parseEther(0));
        });

        it("Correctly net requests with larger withdrawal amount", async function(){
            let nettingAmount = parseEther(1_000);
            let largerAmount = parseEther(1_500);

            await staker.connect(one).indirectWithdrawRequest(largerAmount,one.address,one.address);
            await staker.connect(two).indirectDeposit(nettingAmount, two.address);

            expect(await staker.balanceOf(one.address)).to.equal(userInitialDeposit.sub(largerAmount));
            expect(await staker.balanceOf(two.address)).to.equal(nettingAmount);
            // NOT all fees are collected as deposit fees are collected in advance and withdrawal fees are collected when the request is processed
            expect(await staker.balanceOf(treasury.address)).to.equal(TREASURY_INITIAL_DEPOSIT.add(parseEther(1_000 * depositFee)).add(parseEther(1_000 * withdrawalFee)));

            expect(await staker.getUserPreshares(two.address)).to.equal(parseEther(0));
            
            expect(await staker.dQueueBalance()).to.equal(parseEther(0));
            expect(await staker.wQueueBalance()).to.equal(parseEther(500));
        });
    });
    
    describe("Netting multiple requests",() => {
        it("Correctly net multiple requests of same value", async function(){
            let [globalSharePriceNumerator0, globalSharePriceDenominator0] = await staker.sharePrice();
            let nettingAmount = parseEther(1_000);

            await staker.connect(two).indirectDeposit(parseEther(500), two.address);
            await staker.connect(two).indirectDeposit(parseEther(500), two.address);
            await staker.connect(one).indirectWithdrawRequest(parseEther(1000),one.address,one.address);

            expect(await staker.balanceOf(one.address)).to.equal(userInitialDeposit.sub(nettingAmount));
            expect(await staker.balanceOf(two.address)).to.equal(nettingAmount);
            expect(await staker.balanceOf(treasury.address)).to.equal(TREASURY_INITIAL_DEPOSIT.add(parseEther(1_000 * depositFee)).add(parseEther(1_000 * withdrawalFee)));

            expect(await staker.getUserPreshares(two.address)).to.equal(parseEther(0));
            
            expect(await staker.dQueueBalance()).to.equal(parseEther(0));
            expect(await staker.wQueueBalance()).to.equal(parseEther(0));

            let [globalSharePriceNumerator, globalSharePriceDenominator] = await staker.sharePrice();
            expect(globalSharePriceNumerator.div(globalSharePriceDenominator)).to.equal(globalSharePriceNumerator0.div(globalSharePriceDenominator0));
        });

        it("Correctly net multiple requests with larger deposit amount", async function(){
            let nettingAmount = parseEther(1_000);

            await staker.connect(two).indirectDeposit(parseEther(500), two.address);
            await staker.connect(two).indirectDeposit(parseEther(500), two.address);
            await staker.connect(two).indirectDeposit(parseEther(500), two.address);
            await staker.connect(one).indirectWithdrawRequest(nettingAmount,one.address,one.address);

            expect(await staker.balanceOf(one.address)).to.equal(userInitialDeposit.sub(nettingAmount));
            expect(await staker.balanceOf(two.address)).to.equal(nettingAmount);
            // all fees are collected as deposit fees are collected in advance and withdrawal fees are collected when the request is processed
            expect(await staker.balanceOf(treasury.address)).to.equal(TREASURY_INITIAL_DEPOSIT.add(parseEther(1_500 * depositFee)).add(parseEther(1_000 * withdrawalFee)));

            expect(await staker.getUserPreshares(two.address)).to.equal(parseEther(500));
            
            expect(await staker.dQueueBalance()).to.equal(parseEther(500));
            expect(await staker.wQueueBalance()).to.equal(parseEther(0));
        });

        it("Correctly net multiple requests with larger withdrawal amount", async function(){
            let nettingAmount = parseEther(1_000);
            let largerAmount = parseEther(1_500);

            await staker.connect(one).indirectWithdrawRequest(parseEther(500),one.address,one.address);
            await staker.connect(one).indirectWithdrawRequest(parseEther(500),one.address,one.address);
            await staker.connect(one).indirectWithdrawRequest(parseEther(500),one.address,one.address);
            await staker.connect(two).indirectDeposit(nettingAmount, two.address);

            expect(await staker.balanceOf(one.address)).to.equal(userInitialDeposit.sub(largerAmount));
            expect(await staker.balanceOf(two.address)).to.equal(nettingAmount);
            // NOT all fees are collected as deposit fees are collected in advance and withdrawal fees are collected when the request is processed
            expect(await staker.balanceOf(treasury.address)).to.equal(TREASURY_INITIAL_DEPOSIT.add(parseEther(1_000 * depositFee)).add(parseEther(1_000 * withdrawalFee)));

            expect(await staker.getUserPreshares(two.address)).to.equal(parseEther(0));
            
            expect(await staker.dQueueBalance()).to.equal(parseEther(0));
            expect(await staker.wQueueBalance()).to.equal(parseEther(500));
        });
    });

});
