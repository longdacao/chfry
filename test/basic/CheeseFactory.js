const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;

describe("CheeseFactory contract", function () {
  let cheeseTokenFactory;
  let cheeseToken;
  let cheeseFactory;
  let cheesePrivateStakePool;
  let cheeseStakePool;
  let godUser;
  let user1;
  let user2;
  let timestampBefore;

  async function poolMint() {
    let privateBytes32 = ethers.utils.formatBytes32String("PRIVATE");

    // Call the contract, getting back the transaction
    let transaction = await cheeseFactory.poolMint(privateBytes32);

    // regarding the number of suggested confirmations
    let receipt = await transaction.wait();

    let abi = [
      "event Transfer(address indexed from, address indexed to, uint256 value)",
    ];

    let iface = new ethers.utils.Interface(abi);

    let mintAmount = iface.parseLog(receipt.logs[0]).args.value.toString();

    return mintAmount;
  }

  beforeEach(async function () {
    [godUser, user1, user2] = await ethers.getSigners();

    // Deploy CheeseToken
    cheeseTokenFactory = await ethers.getContractFactory("CheeseToken");
    cheeseToken = await cheeseTokenFactory.deploy(
      "CheeseToken",
      "CheseTokenTest"
    );
    await cheeseToken.deployed();

    // set godUser in the whitelist
    await cheeseToken.setWhitelist(godUser.address, true);

    // Deploy CheeseFactory
    let cheeseFactoryFather = await ethers.getContractFactory("CheeseFactory");
    cheeseFactory = await cheeseFactoryFather.deploy(cheeseToken.address, 10);
    await cheeseFactory.deployed();

    // set godUser in the whitelist
    await cheeseToken.setWhitelist(cheeseFactory.address, true);

    // Deploy CheesePrivateStakePool
    let cheesePrivateStakePoolFactory = await ethers.getContractFactory(
      "CheesePrivateStakePool"
    );

    cheesePrivateStakePool = await cheesePrivateStakePoolFactory.deploy(
      cheeseFactory.address,
      cheeseToken.address
    );
    await cheesePrivateStakePool.deployed();

    // Deploy CheeseStakePool
    let CheeseStakePoolFactory = await ethers.getContractFactory(
      "CheeseStakePool"
    );
    cheeseStakePool = await CheeseStakePoolFactory.deploy(
      cheeseFactory.address,
      cheeseToken.address
    );
    await cheeseStakePool.deployed();

    const blockNumBefore = await ethers.provider.getBlockNumber();
    const blockBefore = await ethers.provider.getBlock(blockNumBefore);
    timestampBefore = blockBefore.timestamp;
  });

  it("Test function of SetCheeseToken", async function () {
    // Create new CheeseToken Contract
    let cheeseTokenNew = await cheeseTokenFactory.deploy(
      "CheeseTokenNew",
      "CheseTokenTest"
    );
    await cheeseTokenNew.deployed();

    // Set chesse token
    await cheeseFactory.setCheeseToken(cheeseTokenNew.address);

    expect(await cheeseFactory.token()).to.equal(cheeseTokenNew.address);
  });

  it("Test function of Initialize", async function () {
    await cheeseFactory.initialize(
      cheesePrivateStakePool.address,
      cheeseStakePool.address,
      timestampBefore + 5
    );

    // Initial twice will failed
    await expect(
      cheeseFactory.initialize(
        cheesePrivateStakePool.address,
        cheeseStakePool.address,
        timestampBefore + 5
      )
    ).to.be.revertedWith("already initialized");
  });

  it("Test function of SetPool", async function () {
    let privateBytes32 = ethers.utils.formatBytes32String("PRIVATE");

    // Create new CheeseToken Contract
    await cheeseFactory.setPool(privateBytes32, cheesePrivateStakePool.address);

    // Check result
    expect((await cheeseFactory.poolInfo(privateBytes32)).pool).to.equal(
      cheesePrivateStakePool.address
    );
  });

  // Todo: it can be tested in loop
  it("PreMint for PRIVATE when time is 8 seconds, which is less than weekTimestamp ( 10 seconds )", async function () {
    const startTimeStamp = timestampBefore + 2;
    await cheeseFactory.initialize(
      godUser.address,
      godUser.address,
      startTimeStamp
    );

    console.log(
      "Please be patient, it will take 8 seconds to test the poolMint function"
    );

    let currentTimeStamp = parseInt(new Date().getTime() / 1000);
    let endTimeStamp = currentTimeStamp + 8;
    while (currentTimeStamp <= endTimeStamp) {
      currentTimeStamp = parseInt(new Date().getTime() / 1000);
    }

    let mintAmount = await poolMint();

    expect(mintAmount).to.equal("6000000000000000000000");
  });

  it("PreMint for PRIVATE when time is 12 seconds, which is more than weekTimestamp ( 10 seconds )", async function () {
    const startTimeStamp = timestampBefore + 2;
    await cheeseFactory.initialize(
      godUser.address,
      godUser.address,
      startTimeStamp
    );

    console.log(
      "Please be patient, it will take 12 seconds to test the poolMint function"
    );

    let currentTimeStamp = parseInt(new Date().getTime() / 1000);
    let endTimeStamp = currentTimeStamp + 12;
    while (currentTimeStamp <= endTimeStamp) {
      currentTimeStamp = parseInt(new Date().getTime() / 1000);
    }

    let mintAmount = await poolMint();

    expect(mintAmount).to.equal("8992200000000000000000");
  });

  it("PreMint when time is 160 seconds, which is much more than max_week_time ( 156 seconds )", async function () {
    // ReDeploy CheeseFactory
    let cheeseFactoryFather = await ethers.getContractFactory("CheeseFactory");
    cheeseFactory = await cheeseFactoryFather.deploy(cheeseToken.address, 1);
    await cheeseFactory.deployed();

    // set godUser in the whitelist
    await cheeseToken.setWhitelist(cheeseFactory.address, true);

    // Try to the get the block timestamp
    const blockNumBefore = await ethers.provider.getBlockNumber();
    const blockBefore = await ethers.provider.getBlock(blockNumBefore);
    const timestampBefore = blockBefore.timestamp;

    const startTimeStamp = timestampBefore + 2;
    await cheeseFactory.initialize(
      godUser.address,
      godUser.address,
      startTimeStamp
    );

    console.log(
      "Please be patient, it will take 160 seconds to test the poolMint function"
    );

    let currentTimeStamp = parseInt(new Date().getTime() / 1000);
    let endTimeStamp = currentTimeStamp + 160;
    while (currentTimeStamp <= endTimeStamp) {
      currentTimeStamp = parseInt(new Date().getTime() / 1000);
    }

    let mintAmount = await poolMint();

    // confusion, it should be like 9,313,200 ~~~
    expect(mintAmount).to.equal("89922000000000000000000");
  });
});
