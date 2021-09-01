const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;

describe("YearnVaultAdapter contract", function () {
  let daiToken;
  let yearnControllerMock;
  let yearnVaultMock;
  let yearnVaultAdapter;
  let godUser;
  let user1;
  let user2;
  let user3;

  beforeEach(async function () {
    [godUser, user1, user2, user3] = await ethers.getSigners();

    // Deploy daiToken
    let daiTokenFactory = await ethers.getContractFactory("Token");
    daiToken = await daiTokenFactory.deploy(
      "daiToken",
      "daiToken",
      1,
      100000
    );
    await daiToken.deployed();

    // Deploy YearnControllerMock
    let yearnControllerMockFactory = await ethers.getContractFactory(
      "YearnControllerMock"
    );
    yearnControllerMock = await yearnControllerMockFactory.deploy();
    await yearnControllerMock.deployed();

    // Deploy YearnControllerMock
    let yearnVaultMockFactory = await ethers.getContractFactory(
      "YearnVaultMock"
    );
    yearnVaultMock = await yearnVaultMockFactory.deploy(
      daiToken.address,
      yearnControllerMock.address
    );
    await yearnVaultMock.deployed();

    // Deploy YearnVaultAdapter
    let yearnVaultAdapterFactory = await ethers.getContractFactory(
      "YearnVaultAdapter"
    );
    yearnVaultAdapter = await yearnVaultAdapterFactory.deploy(
      yearnVaultMock.address,
      godUser.address
    );
    await yearnVaultAdapter.deployed();
  });

  it("Test function of token", async function () {
    let tokenAddress = await yearnVaultAdapter.token();
    expect(tokenAddress).to.equal(daiToken.address);
  });
});
