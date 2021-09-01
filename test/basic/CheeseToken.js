const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;
const { BigNumber, utils } = ethers;

describe("CheeseToken contract", function () {
  let cheeseToken;
  let godUser;
  let user1;
  let user2;

  beforeEach(async function () {
    [godUser, user1, user2] = await ethers.getSigners();

    // Deploy CheeseToken
    let cheeseTokenFactory = await ethers.getContractFactory("CheeseToken");
    cheeseToken = await cheeseTokenFactory.deploy(
      "CheeseToken",
      "CheseTokenTest"
    );
    await cheeseToken.deployed();

    // Set godUser in the whitelist
    await cheeseToken.setWhitelist(godUser.address, true);
  });

  it("Only admin user can set whiteList", async function () {
    await cheeseToken.setWhitelist(user1.address, true);

    // Check result
    expect(await cheeseToken.whiteList(user1.address)).to.be.true;
  });

  it("Granted user can mint token to user", async function () {
    // Set whitelist
    await cheeseToken.setWhitelist(user1.address, true);

    let cheeseTokenUser1 = cheeseToken.connect(user1);

    await cheeseTokenUser1.mint(user1.address, 1000);

    // Check result
    expect(await cheeseTokenUser1.balanceOf(user1.address)).to.equal(1000);
  });

  it("Not granted user cannot mint token to user", async function () {
    let cheeseTokenUser1 = cheeseToken.connect(user1);

    // Mint with no permission
    await expect(cheeseTokenUser1.mint(user1.address, 1000)).to.be.revertedWith(
      "!whitelisted"
    );
  });

  it("Burn Token exceed the amout ", async function () {
    await cheeseToken.mint(user1.address, 1000);

    let cheeseTokenUser1 = cheeseToken.connect(user1);

    // Mint with no permission
    await expect(cheeseTokenUser1.burn(1001)).to.be.revertedWith(
      "ERC20: burn amount exceeds balance"
    );
  });
});
