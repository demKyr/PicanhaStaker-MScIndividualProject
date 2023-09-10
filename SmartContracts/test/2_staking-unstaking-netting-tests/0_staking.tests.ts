import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { deployment } from "../helpers/fixture";
import { parseEther } from "../helpers/math";

describe("STAKING", () => {
    let one, two, three, staker, treasury, phiPrecision, deployer;
    let TREASURY_INITIAL_DEPOSIT
    let depositFee = 0.001;
    let withdrawalFee = 0.001;
    let dQueueThreshold = 15000;
    let wQueueThreshold = 15000;

    beforeEach(async () => {
      ({ treasury, one, two, three, staker, deployer } = await loadFixture(deployment));
      TREASURY_INITIAL_DEPOSIT = parseEther(100); 
      await staker.connect(treasury).directDeposit(TREASURY_INITIAL_DEPOSIT, treasury.address);
    });

    describe("Staking when a direct deposit is made",() => {
      it("Correctly adjust shares and preshares from direct deposits", async function(){
        let depositAmount = parseEther(1_000);
        await staker.connect(one).indirectDeposit(depositAmount, one.address);
        await staker.connect(two).directDeposit(depositAmount, two.address);
        // both users should have shares only as everything is staked
        expect(await staker.balanceOf(one.address)).to.equal(depositAmount);
        expect(await staker.balanceOf(two.address)).to.equal(depositAmount);
        expect(await staker.getUserPreshares(one.address)).to.equal(parseEther(0));
        expect(await staker.dQueueBalance()).to.equal(parseEther(0));
        // Treasury should have shares from the indirect deposit fees
        expect(await staker.balanceOf(treasury.address)).to.equal(parseEther(1_000 * depositFee).add(TREASURY_INITIAL_DEPOSIT));
        // everything is staked
        expect(await staker.totalSupply()).to.equal(TREASURY_INITIAL_DEPOSIT.add(parseEther(2_000)).add(parseEther(1_000 * depositFee)));
        expect(await staker.totalStaked()).to.equal(TREASURY_INITIAL_DEPOSIT.add(parseEther(2_000)).add((parseEther(1_000 * depositFee))));
        expect(await staker.totalAssets()).to.equal(0);
      });
    });

    describe("Staking when threshold is reached",() => {
      it("Correctly adjust shares and preshares from indirect deposits", async function(){
        for(let i = 0; i < 20; i++){
          const tx  = await staker.connect(one).indirectDeposit(parseEther(1_000), one.address);
          await tx.wait();
          const events = await staker.queryFilter("StakeRequired", tx.blockNumber);
          if(events.length > 0){
            await staker.connect(treasury).indirectStake();
          }
        }
        // user shoud have shares from staked deposits only, the rest should be preshares and pending in the dQueue
        expect(await staker.balanceOf(one.address)).to.equal(parseEther(dQueueThreshold));
        expect(await staker.getUserPreshares(one.address)).to.equal(parseEther(5_000));
        expect(await staker.dQueueBalance()).to.equal(parseEther(5_000));
        // Treasury should have shares from all the deposit fees
        expect(await staker.balanceOf(treasury.address)).to.equal(parseEther(20_000 * depositFee).add(TREASURY_INITIAL_DEPOSIT));
        // total supply should be the sum of shares for the initial deposit, the staked deposits and the treasury shares from ALL the deposit fees
        expect(await staker.totalSupply()).to.equal(parseEther(dQueueThreshold).add(TREASURY_INITIAL_DEPOSIT).add(parseEther(20_000 * depositFee)));
        // total staked should be the sum of shares for the initial deposit, the staked deposits and the treasury shares from the STAKED deposit fees ONLY
        expect(await staker.totalStaked()).to.equal(parseEther(dQueueThreshold).add(TREASURY_INITIAL_DEPOSIT).add(parseEther(dQueueThreshold * depositFee)));
        // vault should contain the non staked deposits and their deposit fees
        expect(await staker.totalAssets()).to.equal(parseEther(5000).add(parseEther(5_000 * depositFee)));
      });
      
      it("Does not split deposit requests when threshold is reached", async function(){
        let depositAmount = parseEther(20_000);
        
        await staker.connect(one).indirectDeposit(parseEther(10_000), one.address);
        const tx = await staker.connect(one).indirectDeposit(parseEther(10_000), one.address);
        await tx.wait();
        const events = await staker.queryFilter("StakeRequired", tx.blockNumber);
        if(events.length > 0){
          await staker.connect(treasury).indirectStake();
        }
        expect(await staker.balanceOf(one.address)).to.equal(depositAmount);
        expect(await staker.getUserPreshares(one.address)).to.equal(parseEther(0));
        expect(await staker.dQueueBalance()).to.equal(parseEther(0));
        expect(await staker.balanceOf(treasury.address)).to.equal(parseEther(20_000 * depositFee).add(TREASURY_INITIAL_DEPOSIT));
        expect(await staker.totalSupply()).to.equal(depositAmount.add(TREASURY_INITIAL_DEPOSIT).add(parseEther(20_000 * depositFee)));
        expect(await staker.totalStaked()).to.equal(depositAmount.add(TREASURY_INITIAL_DEPOSIT).add((parseEther(20_000 * depositFee))));
        expect(await staker.totalAssets()).to.equal(0);
      });
    });
    
    describe("Staking when a request expires",() => {
      const expiryPeriod = 7 * 86400;
      it("Correctly adjust shares and preshares from indirect deposits", async function(){
        let depositAmount = parseEther(2_000);
        await staker.connect(one).indirectDeposit(parseEther(1_000), one.address);
        await time.increase(expiryPeriod + 1);
        const tx = await staker.connect(one).indirectDeposit(parseEther(1_000), one.address);
        await tx.wait();
        const events = await staker.queryFilter("StakeRequired", tx.blockNumber);
        if(events.length > 0){
          await staker.connect(treasury).indirectStake();
        }

        expect(await staker.balanceOf(one.address)).to.equal(depositAmount);
        expect(await staker.getUserPreshares(one.address)).to.equal(parseEther(0));
        expect(await staker.dQueueBalance()).to.equal(parseEther(0));
        expect(await staker.balanceOf(treasury.address)).to.equal(parseEther(2_000 * depositFee).add(TREASURY_INITIAL_DEPOSIT));
        expect(await staker.totalSupply()).to.equal(depositAmount.add(TREASURY_INITIAL_DEPOSIT).add(parseEther(2_000 * depositFee)));
        expect(await staker.totalStaked()).to.equal(depositAmount.add(TREASURY_INITIAL_DEPOSIT).add((parseEther(2_000 * depositFee))));
        expect(await staker.totalAssets()).to.equal(0);
      });
      
      it("Should not allow unstaking when a request has 0 amount", async function(){
        let depositAmount = parseEther(2_000);
        await staker.connect(one).indirectDeposit(parseEther(1_000), one.address);
        await staker.connect(two).indirectDeposit(parseEther(1_000), two.address);
        await staker.connect(three).indirectDeposit(parseEther(1_000), three.address);
        await staker.connect(three).indirectWithdrawRequest(parseEther(1_000),three.address,three.address);
        await staker.connect(two).indirectWithdrawRequest(parseEther(1_000),two.address,two.address);
        await staker.connect(one).indirectWithdrawRequest(parseEther(1_000),one.address,one.address);
        await time.increase(expiryPeriod + 1);
        await staker.connect(one).indirectDeposit(parseEther(1_000), one.address);
  
        expect(await staker.balanceOf(one.address)).to.equal(0);
        expect(await staker.getUserPreshares(one.address)).to.equal(parseEther(1_000));
        expect(await staker.dQueueBalance()).to.equal(parseEther(1_000));
        expect(await staker.balanceOf(treasury.address)).to.equal(parseEther(4_000 * depositFee).add(parseEther(3_000 * withdrawalFee)).add(TREASURY_INITIAL_DEPOSIT));
        expect(await staker.totalSupply()).to.equal(TREASURY_INITIAL_DEPOSIT.add(parseEther(4_000 * depositFee)).add(parseEther(3_000 * withdrawalFee)));
        expect(await staker.totalStaked()).to.equal(TREASURY_INITIAL_DEPOSIT);
        expect(await staker.totalAssets()).to.equal(parseEther(1_000).add(parseEther(4_000 * depositFee)).add(parseEther(3_000 * withdrawalFee)));
      });
    });

});
