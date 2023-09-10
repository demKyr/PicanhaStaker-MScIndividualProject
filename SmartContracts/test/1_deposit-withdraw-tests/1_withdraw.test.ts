import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import * as constants from "../helpers/constants";
import { deployment } from "../helpers/fixture";
import { calculateSharesFromAmount, divSharePrice, parseEther } from "../helpers/math";
import { submitCheckpoint } from "../helpers/state-interaction";

describe("WITHDRAW REQUEST", () => {
  // Initial state, deposits, rewards compounding already tested

  let treasury, deployer, one, two, staker;
  let TREASURY_INITIAL_DEPOSIT;

  beforeEach(async () => {
    // reset to fixture
    ({ treasury, deployer, one, two, staker } = await loadFixture(deployment));
    TREASURY_INITIAL_DEPOSIT = parseEther(5)
    await staker.connect(treasury).directDeposit(TREASURY_INITIAL_DEPOSIT, treasury.address);
  });

  it("clear the vault", async () => {
    await staker.connect(treasury).directWithdrawRequest(TREASURY_INITIAL_DEPOSIT, treasury.address, treasury.address);
    expect(await staker.totalStaked()).to.equal(0);
    expect(await staker.totalSupply()).to.equal(0);
    expect(await staker.balanceOf(treasury.address)).to.equal(0);
    expect(await staker.totalAssets()).to.equal(0);
  });

  it("basic indirect withdrawal", async () => {
    await staker.connect(one).directDeposit(parseEther(10000), one.address);
    await staker.connect(one).indirectWithdrawRequest(parseEther(1000), one.address, one.address);
    expect(await staker.wQueueBalance()).to.equal(parseEther(1000));
    expect(await staker.balanceOf(one.address)).to.equal(parseEther(9000));
    expect(await staker.totalStaked()).to.equal(parseEther(10000).add(TREASURY_INITIAL_DEPOSIT));
  });
  
  it("basic direct withdrawal", async () => {
    await staker.connect(one).directDeposit(parseEther(10000), one.address);
    await staker.connect(one).directWithdrawRequest(parseEther(1000), one.address, one.address);
    expect(await staker.wQueueBalance()).to.equal(0);
    expect(await staker.balanceOf(one.address)).to.equal(parseEther(9000));
    expect(await staker.totalStaked()).to.equal(parseEther(9000).add(TREASURY_INITIAL_DEPOSIT));
  });

  it("try initiating a withdrawal of size zero", async () => {
    await expect(staker.connect(one).directWithdrawRequest(parseEther(0), one.address, one.address)).to.be.revertedWithCustomError(
      staker,
      "WithdrawalRequestAmountCannotEqualZero"
    );
  });

  it("try initiating withdrawal of more than deposited", async () => {
    // Deposit 10M with account one
    await staker.connect(one).directDeposit(parseEther(10e6), one.address);

    await expect(
      staker.connect(one).directWithdrawRequest(parseEther(15e6), one.address, one.address)
    ).to.be.revertedWithCustomError(staker, "WithdrawalAmountTooLarge");
  });

  it("indirect withdrawal less than preshares", async () => {
    await staker.connect(two).indirectDeposit(parseEther(1000), two.address);
    await staker.connect(two).indirectDeposit(parseEther(1000), two.address);
    await staker.connect(one).indirectDeposit(parseEther(100), one.address);
    await staker.connect(two).indirectDeposit(parseEther(1000), two.address);
    await staker.connect(one).indirectDeposit(parseEther(900), one.address);
    await staker.connect(two).indirectDeposit(parseEther(1000), two.address);

    expect(await staker.dQueueBalance()).to.equal(parseEther(5000));
    expect(await staker.connect(one).getUserPreshares(one.address)).to.equal(parseEther(1000));

    await staker.connect(one).indirectWithdrawRequest(parseEther(200), one.address, one.address);

    expect(await staker.dQueueBalance()).to.equal(parseEther(4800));
    expect(await staker.connect(one).getUserPreshares(one.address)).to.equal(parseEther(800));
  });

  it("direct withdrawal less than preshares", async () => {
    await staker.connect(two).indirectDeposit(parseEther(1000), two.address);
    await staker.connect(two).indirectDeposit(parseEther(1000), two.address);
    await staker.connect(one).indirectDeposit(parseEther(100), one.address);
    await staker.connect(two).indirectDeposit(parseEther(1000), two.address);
    await staker.connect(one).indirectDeposit(parseEther(900), one.address);
    await staker.connect(two).indirectDeposit(parseEther(1000), two.address);

    expect(await staker.dQueueBalance()).to.equal(parseEther(5000));
    expect(await staker.connect(one).getUserPreshares(one.address)).to.equal(parseEther(1000));

    await staker.connect(one).directWithdrawRequest(parseEther(200), one.address, one.address);

    expect(await staker.dQueueBalance()).to.equal(parseEther(4800));
    expect(await staker.connect(one).getUserPreshares(one.address)).to.equal(parseEther(800));
  });

  it("indirect withdrawal more than preshares", async () => {
    await staker.connect(one).directDeposit(parseEther(900), one.address);
    await staker.connect(one).indirectDeposit(parseEther(100), one.address);

    expect(await staker.dQueueBalance()).to.equal(parseEther(100));
    expect(await staker.connect(one).getUserPreshares(one.address)).to.equal(parseEther(100));

    await staker.connect(one).indirectWithdrawRequest(parseEther(200), one.address, one.address);

    expect(await staker.wQueueBalance()).to.equal(parseEther(100));
    expect(await staker.connect(one).getUserPreshares(one.address)).to.equal(0);
  });

  it("direct withdrawal more than preshares", async () => {
    await staker.connect(one).directDeposit(parseEther(900), one.address);
    await staker.connect(one).indirectDeposit(parseEther(100), one.address);

    expect(await staker.dQueueBalance()).to.equal(parseEther(100));
    expect(await staker.connect(one).getUserPreshares(one.address)).to.equal(parseEther(100));

    await staker.connect(one).directWithdrawRequest(parseEther(200), one.address, one.address);

    expect(await staker.wQueueBalance()).to.equal(0);
    expect(await staker.connect(one).getUserPreshares(one.address)).to.equal(0);
    expect(await staker.totalStaked()).to.equal(parseEther(800).add(TREASURY_INITIAL_DEPOSIT));
  });

  it("initiate multiple partial direct withdrawals", async () => {
    // Deposit 10000 with account one
    await staker.connect(one).directDeposit(parseEther(10000), one.address);

    // Testing summing of user pending withdrawals
    await staker.connect(one).directWithdrawRequest(parseEther(2000), one.address, one.address);
    await staker.connect(one).directWithdrawRequest(parseEther(5000), one.address, one.address);

    // Check vault values
    expect(await staker.totalStaked()).to.equal(parseEther(3000).add(TREASURY_INITIAL_DEPOSIT));
  });

  it("initiate withdrawal with rewards wip", async () => {
    // Deposit 10M with account one
    await staker.connect(one).directDeposit(parseEther(10e6), one.address);

    // Accrue rewards (about 26.6 matic)
    await submitCheckpoint(0);

    // save some variables for checks
    let totalRewards = await staker.totalRewards();
    let totalStaked = await staker.totalStaked();
    let totalShares = await staker.totalSupply();
    let sharePrice = await staker.sharePrice();
    let withdrawAmt = parseEther(3e6);
    let withdrawShares = calculateSharesFromAmount(withdrawAmt, sharePrice);
    let trsyShares = calculateSharesFromAmount(TREASURY_INITIAL_DEPOSIT, sharePrice);
    let shareDecUsr = withdrawShares;
    let shareIncTsy = totalRewards
      .mul(constants.PHI)
      .mul(parseEther(1))
      .mul(sharePrice[1])
      .div(sharePrice[0])
      .div(constants.PHI_PRECISION);

    // check vault + user variables pre-request
    expect(totalRewards).to.be.greaterThan(parseEther(0)); // double check rewards have increased
    expect(await staker.totalAssets()).to.equal(0);
    expect(await staker.totalStaked()).to.equal(parseEther(10e6).add(TREASURY_INITIAL_DEPOSIT));
    expect(await staker.totalSupply()).to.equal(parseEther(10e6).add(TREASURY_INITIAL_DEPOSIT));
    expect(await staker.balanceOf(one.address)).to.equal(parseEther(10e6));

    // Initiate withdrawal
    await staker.connect(one).directWithdrawRequest(withdrawAmt, one.address, one.address);

    // check vault + user variables post-request
    expect(divSharePrice(await staker.sharePrice())).to.equal(divSharePrice(sharePrice));
    expect(await staker.totalRewards()).to.equal(0);
    expect(await staker.totalAssets()).to.equal(totalRewards);
    expect(await staker.totalStaked()).to.equal(totalStaked.sub(withdrawAmt));
    expect(await staker.totalSupply()).to.equal(totalShares.sub(shareDecUsr).add(shareIncTsy));
    expect(await staker.balanceOf(one.address)).to.equal(totalShares.sub(shareDecUsr).sub(TREASURY_INITIAL_DEPOSIT));
    expect(await staker.balanceOf(treasury.address)).to.equal(TREASURY_INITIAL_DEPOSIT.add(shareIncTsy));
  });

});
