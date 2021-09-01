const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;

describe("FryerConfig contract", function () {
  let fryerConfig;
  let godUser;
  let user1;
  let user2;
  let user3;

  beforeEach(async function () {
    [godUser, user1, user2, user3] = await ethers.getSigners();

    // Deploy FryerConfig
    let fryerConfigFactory = await ethers.getContractFactory("FryerConfig");
    fryerConfig = await fryerConfigFactory.deploy();
    await fryerConfig.deployed();
  });

  it("Test the function of getConfig", async function () {
    let configName = "FRYER_LTV";
    let configNameBytes32 = ethers.utils.formatBytes32String(configName);
    let [minValue, maxValue, maxSpan, value, enable] =
      await fryerConfig.getConfig(configNameBytes32);

    // Check result
    expect(minValue.toString()).to.equal("5000");
    expect(maxValue.toString()).to.equal("8000");
    expect(maxSpan.toString()).to.equal("100");
    expect(value.toString()).to.equal("5000");
    expect(enable.toString()).to.equal("1");
  });
});
