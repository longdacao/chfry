const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;

describe("TokenTimeRelease contract", function () {
  let daiToken;
  let tokenTimeLockManager;
  let daiTokenUser1;
  let blockTimeLast;
  let godUser;
  let user1;
  let user2;
  let user3;

  beforeEach(async function () {
    [godUser, user1, user2, user3] = await ethers.getSigners();

    // Deploy daiToken
    let daiTokenFactory = await ethers.getContractFactory("Token");
    daiToken = await daiTokenFactory.deploy("DaiToken", "DaiToken", 1, 100000);
    await daiToken.deployed();

    // Deploy TokenTimeRelease
    let tokenTimeLockManagerFactory = await ethers.getContractFactory(
      "TokenTimeLockManager"
    );
    tokenTimeLockManager = await tokenTimeLockManagerFactory.deploy();
    await tokenTimeLockManager.deployed();

    // Mint Dai Token for goduser
    await daiToken.mint(user1.address, 100);

    // User1 approve transfer permission for tokenTimeLockManager
    daiTokenUser1 = daiToken.connect(user1);
    await daiTokenUser1.approve(tokenTimeLockManager.address, 1000);

    // Get the block timestamp
    const blockNum = await ethers.provider.getBlockNumber();
    const blockDetail = await ethers.provider.getBlock(blockNum);
    blockTimeLast = blockDetail.timestamp;
  });

  it("Test function of create and getTokenTimeLocks", async function () {
    
  });
});
