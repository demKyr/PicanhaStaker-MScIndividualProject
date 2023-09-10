import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { deployment } from "../helpers/fixture";
import { parseEther } from "../helpers/math";

describe("DEPOSITS", () => {
  let one, two, staker, stakeManager;

  beforeEach(async () => {
    // reset to fixture
    ({ one, two, staker, stakeManager } = await loadFixture(deployment));
  });

  describe("Preshares", async () => {
    
    it("Indirect Deposits to preshares", async () => {
      await staker.connect(one).indirectDeposit(parseEther(101), one.address);
      expect(await staker.getUserPreshares(one.address)).to.equal(parseEther(101));
      
      await staker.connect(two).indirectDeposit(parseEther(102), two.address);
      expect(await staker.getUserPreshares(two.address)).to.equal(parseEther(102));
      
      await staker.connect(one).indirectDeposit(parseEther(103), one.address);
      expect(await staker.getUserPreshares(one.address)).to.equal(parseEther(101 + 103));
      expect(await staker.balanceOf(one.address)).to.equal(0);
      
      expect(await staker.dQueueBalance()).to.equal(parseEther(101 + 102 + 103));
    });
    
    it("Deposits to preshares to shares", async () => {
      await staker.connect(one).indirectDeposit(parseEther(101), one.address);
      expect(await staker.getUserPreshares(one.address)).to.equal(parseEther(101));
      expect(await staker.dQueueBalance()).to.equal(parseEther(101));
      
      await staker.connect(two).directDeposit(parseEther(102), two.address);
      
      expect(await staker.getUserPreshares(one.address)).to.equal(0);
      expect(await staker.getUserPreshares(two.address)).to.equal(0);
      expect(await staker.dQueueBalance()).to.equal(parseEther(0));
      
      expect(await staker.balanceOf(one.address)).to.equal(parseEther(101));
      expect(await staker.balanceOf(two.address)).to.equal(parseEther(102));
    });
    
  });
  
});
