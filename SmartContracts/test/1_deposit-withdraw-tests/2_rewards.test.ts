import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployment } from "../helpers/fixture";
import { submitCheckpoint } from "../helpers/state-interaction";
import { parseEther } from "../helpers/math";

describe("Checkpoint Submissions", () => {
  let staker, one; 

  it("use submitCheckpoint multiple times, ensure rewards are increasing each time", async () => {
    // load fixture
    ({ staker, one } = await loadFixture(deployment));

    // deposit so rewards can accrue
    await staker.connect(one).directDeposit(parseEther(1000), one.address);

    // store initial rewards value (should be zero)
    let lastRewards = await staker.totalRewards();
    
    // submit as many times as there are saved checkpoints, check rewards always increase
    for(let i = 0; i<5; i++){
      
      //submit new checkpoint
      await submitCheckpoint(i);

      // set new rewards
      let newRewards = await staker.totalRewards()

      // check values are increasing each time
      expect(newRewards).to.be.greaterThan(lastRewards);

      // set last rewards
      lastRewards = newRewards;
    }  
  });
});

