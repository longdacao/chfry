const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;

describe("FriesToken contract", function () {
  let friesToken;
  let daiToken;
  let oven;
  let godUser;
  let user1;
  let user2;
  let user3;

  beforeEach(async function () {
    [godUser, user1, user2, user3] = await ethers.getSigners();

    // Mock Dai Token
    let daiTokenFactory = await ethers.getContractFactory("Token");
    daiToken = await daiTokenFactory.deploy("Dai", "Dai", 18, 100000);
    await daiToken.deployed();

    await daiToken.mint(godUser.address,1000);

    // Deploy FriesToken
    let friesTokenFactory = await ethers.getContractFactory("FriesToken");
    friesToken = await friesTokenFactory.deploy();
    await friesToken.deployed();

    // set WhiteList
    await friesToken.setWhitelist(godUser.address, true);

    // Set Ceiling
    await friesToken.setCeiling(godUser.address, 1000000);

    // Mint
    await friesToken.mint(godUser.address, 1000);

    // Deploy Oven
    let ovenFactory = await ethers.getContractFactory("Oven");
    oven = await ovenFactory.deploy(friesToken.address,daiToken.address);
    await oven.deployed();

    // Set oven whiteList
    await oven.setWhitelist(godUser.address,true);
  });

  it("Test the function of stake", async function () {
    // Approve transfer permission 
    await friesToken.approve(oven.address,1000);

    // godUser Stake friesToken
    await oven.stake(100);

    // Check result
    let stakeAmount = await oven.depositedFriesTokens(godUser.address);
    expect(stakeAmount).to.equal(100);

  });

  it("Test the function of Unstake", async function () {
    // Approve transfer permission 
    await friesToken.approve(oven.address,1000);

    // godUser Stake friesToken
    await oven.stake(100);

    // Do unstake
    await oven.unstake(60);

    // Check result
    let stakeAmount = await oven.depositedFriesTokens(godUser.address);
    expect(stakeAmount).to.equal(40);

  }); 

  it("Test the function of dividendsOwing", async function () {
    // Approve transfer permission 
    await friesToken.approve(oven.address,1000);

    // godUser Stake friesToken
    await oven.stake(100);

    // Do unstake
    await oven.unstake(60);

    // Check result
    let stakeAmount = await oven.depositedFriesTokens(godUser.address);
    expect(stakeAmount).to.equal(40);

    // Check the dividendsOwing
    let dividendsOwing = await oven.dividendsOwing(godUser.address);
    expect(dividendsOwing).to.equal(0);
  }); 

  it("Test the function of distribute", async function () {
    // Approve transfer permission 
    await daiToken.approve(oven.address,1000);

    // godUser Stake friesToken
    await oven.distribute(godUser.address,100);

    // Check result
    let bufferAmount = await oven.buffer();
    expect(bufferAmount).to.equal(100);
  }); 

  it("Test the function of distribute", async function () {
    // Approve transfer permission 
    await daiToken.approve(oven.address,1000);

    // godUser Stake friesToken
    await oven.distribute(godUser.address,100);

    // Check result
    let bufferAmount = await oven.buffer();
    expect(bufferAmount).to.equal(100);
  }); 
  
});
