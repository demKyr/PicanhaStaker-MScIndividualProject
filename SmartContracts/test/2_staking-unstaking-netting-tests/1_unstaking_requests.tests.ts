import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { deployment } from "../helpers/fixture";
import { parseEther } from "../helpers/math";

describe("UNSTAKING REQUEST", () => {
  let TREASURY_INITIAL_DEPOSIT
  let one, two, three, staker, treasury, phiPrecision, deployer;
  let userInitialDeposit;
  beforeEach(async () => {
    ({ treasury, one, two, three, staker, deployer } = await loadFixture(deployment));
    TREASURY_INITIAL_DEPOSIT = parseEther(100); 
    await staker.connect(treasury).directDeposit(TREASURY_INITIAL_DEPOSIT, treasury.address);
    });

    describe("Unstaking when a direct withdrawal is made",() => {
        it("Correctly adjust shares and preshares from direct withdrawals", async function(){
            userInitialDeposit = parseEther(50_000);
            await staker.connect(one).directDeposit(userInitialDeposit, one.address);
            await staker.connect(two).directDeposit(userInitialDeposit, two.address);
            let withdrawalAmount = parseEther(1_000);
            await staker.connect(one).indirectWithdrawRequest(withdrawalAmount,one.address,one.address);
            await staker.connect(two).directWithdrawRequest(withdrawalAmount,two.address,two.address);
            // both users should have reduced shares
            expect(await staker.balanceOf(one.address)).to.equal(userInitialDeposit.sub(withdrawalAmount));
            expect(await staker.balanceOf(two.address)).to.equal(userInitialDeposit.sub(withdrawalAmount));
            expect(await staker.wQueueBalance()).to.equal(parseEther(0));
            // Treasury should not have shares as withdrawal fees are not collected yet
            expect(await staker.balanceOf(treasury.address)).to.equal(TREASURY_INITIAL_DEPOSIT);
            // Shares are burnt
            expect(await staker.totalSupply()).to.equal(TREASURY_INITIAL_DEPOSIT.add(parseEther(100_000)).sub(parseEther(2_000)));
            // Unstake is called
            expect(await staker.totalStaked()).to.equal(TREASURY_INITIAL_DEPOSIT.add(parseEther(100_000)).sub(parseEther(2_000)));
            // Funds are not claimed yet
            expect(await staker.totalAssets()).to.equal(0);
        });
    });
    
    
    
    describe("Unstaking when threshold is reached",() => {
        it("Correctly adjust shares from indirect withdrawals", async function(){
            userInitialDeposit = parseEther(20_000);
            await staker.connect(one).directDeposit(userInitialDeposit, one.address);
            let withdrawalAmount = parseEther(1_000);
            for(let i = 0; i < 20; i++){
                const tx = await staker.connect(one).indirectWithdrawRequest(withdrawalAmount,one.address,one.address);
                await tx.wait();
                const events = await staker.queryFilter("UnstakeRequired", tx.blockNumber);
                if(events.length > 0){
                    await staker.connect(treasury).indirectUnstakeRequest();
                }
            }
            // all shares are burnt regardless of whether the request is unstaked or not
            expect(await staker.balanceOf(one.address)).to.equal(0);
            expect(await staker.totalSupply()).to.equal(TREASURY_INITIAL_DEPOSIT);
            // some requests are not unstaked yet
            expect(await staker.wQueueBalance()).to.equal(parseEther(5_000));
            expect(await staker.totalStaked()).to.equal(TREASURY_INITIAL_DEPOSIT.add(parseEther(5_000)));
            // Treasury should not have shares from the withdrawal fees yet
            expect(await staker.balanceOf(treasury.address)).to.equal(TREASURY_INITIAL_DEPOSIT);
            // Funds are not claimed yet
            expect(await staker.totalAssets()).to.equal(0);
        });

        it("Does not split withdrawal requests when threshold is reached", async function(){
            userInitialDeposit = parseEther(20_000);
            await staker.connect(one).directDeposit(userInitialDeposit, one.address);
            
            await staker.connect(one).indirectWithdrawRequest(parseEther(10_000),one.address,one.address);
            const tx = await staker.connect(one).indirectWithdrawRequest(parseEther(10_000),one.address,one.address);
            await tx.wait();
            const events = await staker.queryFilter("UnstakeRequired", tx.blockNumber);
            if(events.length > 0){
                await staker.connect(treasury).indirectUnstakeRequest();
            }
            // all shares are burnt
            expect(await staker.balanceOf(one.address)).to.equal(0);
            expect(await staker.totalSupply()).to.equal(TREASURY_INITIAL_DEPOSIT);
            // all requests are unstaked yet
            expect(await staker.wQueueBalance()).to.equal(0);
            expect(await staker.totalStaked()).to.equal(TREASURY_INITIAL_DEPOSIT);
            // Treasury should not have shares from the withdrawal fees yet
            expect(await staker.balanceOf(treasury.address)).to.equal(TREASURY_INITIAL_DEPOSIT);
            // Funds are not claimed yet
            expect(await staker.totalAssets()).to.equal(0);
        });
    });
    
    describe("Unstaking when a request expires",() => {
        const expiryPeriod = 7 * 86400;
        it("Correctly adjust shares and preshares from indirect deposits", async function(){
            userInitialDeposit = parseEther(3_000);
            await staker.connect(one).directDeposit(userInitialDeposit, one.address);
            
            let withdrawalAmount = parseEther(1_000);
            await staker.connect(one).indirectWithdrawRequest(withdrawalAmount,one.address,one.address);
            await time.increase(expiryPeriod + 1);
            // this should be unstaked along with the first request
            let tx = await staker.connect(one).indirectWithdrawRequest(withdrawalAmount,one.address,one.address);
            await tx.wait();
            let events = await staker.queryFilter("UnstakeRequired", tx.blockNumber);
            if(events.length > 0){
                await staker.connect(treasury).indirectUnstakeRequest();
            }
            // this should not be unstaked
            tx = await staker.connect(one).indirectWithdrawRequest(withdrawalAmount,one.address,one.address);
            await tx.wait();
            events = await staker.queryFilter("UnstakeRequired", tx.blockNumber);
            if(events.length > 0){
                await staker.connect(treasury).indirectUnstakeRequest();
            }
    
            // all shares are burnt regardless of whether the request is unstaked or not
            expect(await staker.balanceOf(one.address)).to.equal(0);
            expect(await staker.totalSupply()).to.equal(TREASURY_INITIAL_DEPOSIT);
            // some requests are not unstaked yet
            expect(await staker.wQueueBalance()).to.equal(withdrawalAmount);
            expect(await staker.totalStaked()).to.equal(TREASURY_INITIAL_DEPOSIT.add(withdrawalAmount));
            // Treasury should not have shares from the withdrawal fees yet
            expect(await staker.balanceOf(treasury.address)).to.equal(TREASURY_INITIAL_DEPOSIT);
            // Funds are not claimed yet
            expect(await staker.totalAssets()).to.equal(0);
        });
    });

});
