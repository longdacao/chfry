const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;

describe("FriesToken contract", function () {
  let friesToken;
  let godUser;
  let user1;
  let user2;
  let user3;

  beforeEach(async function () {
    [godUser, user1, user2, user3] = await ethers.getSigners();

    // Deploy FixedPointMathTest
    let friesTokenFactory = await ethers.getContractFactory("FriesToken");
    friesToken = await friesTokenFactory.deploy();
    await friesToken.deployed();
  });

  it("Only admin user can set Whitelist", async function () {
    await friesToken.setWhitelist(user2.address, true);

    // Check result
    expect(await friesToken.whiteList(user2.address)).to.be.true;

    // Switch to user2
    let friesTokenUser2 = friesToken.connect(user2);
    await expect(
      friesTokenUser2.setWhitelist(user3.address, true)
    ).to.be.revertedWith("only admin");
  });

  it("Only onlySentinel user can set Blacklist", async function () {
    await friesToken.setBlacklist(user2.address);

    // Check result
    expect(await friesToken.blacklist(user2.address)).to.be.true;

    // Switch to user2
    let friesTokenUser2 = friesToken.connect(user2);
    await expect(
      friesTokenUser2.setBlacklist(user3.address)
    ).to.be.revertedWith("only sentinel");
  });

  it("Test function of LowerHasMinted", async function () {
    // set WhiteList
    await friesToken.setWhitelist(godUser.address, true);

    // Set Ceiling
    await friesToken.setCeiling(godUser.address, 1000000);

    // Mint
    await friesToken.mint(godUser.address, 1000);

    // Check result
    expect(await friesToken.hasMinted(godUser.address)).to.equal(1000);

    // lower HasMinted
    await friesToken.lowerHasMinted(100);

    // Check result
    expect(await friesToken.hasMinted(godUser.address)).to.equal(900);
  });
});
