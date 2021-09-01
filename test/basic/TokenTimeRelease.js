const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;

describe("TokenTimeRelease contract", function () {
  let daiToken;
  let tokenTimeRelease;
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

    // Get the block timestamp
    const blockNum = await ethers.provider.getBlockNumber();
    const blockDetail = await ethers.provider.getBlock(blockNum);
    blockTimeLast = blockDetail.timestamp;

    // Deploy TokenTimeRelease
    let tokenTimeReleaseFactory = await ethers.getContractFactory(
      "TokenTimeRelease"
    );
    tokenTimeRelease = await tokenTimeReleaseFactory.deploy(
      daiToken.address,
      user2.address,
      blockTimeLast + 20,
      100
    );
    await tokenTimeRelease.deployed();
  });

  it("Test function of token", async function () {
    let tokenAddress = await tokenTimeRelease.token();
    expect(tokenAddress).to.equal(daiToken.address);
  });

  it("Test function of currentIncome", async function () {
    // Before calculate the income, wait 5 seconds
    console.log("Before calculate the income, wait 5 seconds");

    // Get the last block timestamp
    const blockNum = await ethers.provider.getBlockNumber();
    const blockDetail = await ethers.provider.getBlock(blockNum);
    blockTimeLast = blockDetail.timestamp;

    let currentTimeStamp = parseInt(new Date().getTime() / 1000);
    let endTimeStamp = blockTimeLast + 5;
    while (currentTimeStamp <= endTimeStamp) {
      currentTimeStamp = parseInt(new Date().getTime() / 1000);
    }

    let currentIncome = await tokenTimeRelease.currentIncome();
    console.log("currentIncome :", parseInt(currentIncome));
  });
});
