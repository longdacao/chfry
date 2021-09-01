const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;

describe("CheesePrivateStakePool contract", function () {
  let cheeseTokenFactory;
  let cheeseToken;
  let cheeseTokenUser1;
  let cheeseFactory;
  let cheesePrivateStakePool;
  let cheeseStakePool;
  let godUser;
  let user1;
  let user2;
  let timestampBefore;

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

    // set cheeseFactory in the whitelist
    await cheeseToken.setWhitelist(cheeseFactory.address, true);

    // Mint CheeseToken for user1 
    await cheeseToken.mint(user1.address, 1000);

    // Deploy CheesePrivateStakePool
    let cheesePrivateStakePoolFactory = await ethers.getContractFactory(
      "CheesePrivateStakePool"
    );

    cheesePrivateStakePool = await cheesePrivateStakePoolFactory.deploy(
      cheeseFactory.address,
      cheeseToken.address
    );
    await cheesePrivateStakePool.deployed();

    //  Get cheeseToken instance for user1
    cheeseTokenUser1 = cheeseToken.connect(user1);

    // User1 approve transfer for 
    await cheeseTokenUser1.approve(cheesePrivateStakePool.address,1000);

    // Add use1 to the whiteList of cheesePrivateStakePool
    await cheesePrivateStakePool.setWhitelist(user1.address,true);

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

  async function privateStake(privateStakePool,amount) {
    // Call the contract, getting back the transaction
    let transaction = await privateStakePool.stake(amount);

    // regarding the number of suggested confirmations
    let receipt = await transaction.wait();

    let abi = [
      "event Stake(address indexed user, uint256 indexed amount)",
    ];

    let iface = new ethers.utils.Interface(abi);

    for(var log of receipt.logs){
      if (log.topics.includes('0xebedb8b3c678666e7f36970bc8f57abf6d8fa2e828c0da91ea5b75bf68ed101a')) {
        let stakeAmount = iface.parseLog(log).args.amount.toString();

        return stakeAmount;
      }
    }
  }

  it("Test functon of SetCheeseFactory", async function () {
    // Deploy new CheeseFactory
    let cheeseFactoryNewFather = await ethers.getContractFactory("CheeseFactory");
    let cheeseFactoryNew = await cheeseFactoryNewFather.deploy(cheeseToken.address, 10);
    await cheeseFactoryNew.deployed();

    // Set CheeseFactory
    await cheesePrivateStakePool.setCheeseFactory(cheeseFactoryNew.address);

    // Check result
    expect(await cheesePrivateStakePool.cheeseFactory()).to.equal(cheeseFactoryNew.address);
  });

  it("Test function of Stake", async function () {
    // Initial CheeseFactory 
    await cheeseFactory.initialize(
      cheesePrivateStakePool.address,
      cheeseStakePool.address,
      timestampBefore + 2
    );

    console.log(
      "Please be patient, it will take 8 seconds to do the First stake"
    );

    let currentTimeStamp = parseInt(new Date().getTime() / 1000);
    let endTimeStamp = currentTimeStamp + 8;
    while (currentTimeStamp <= endTimeStamp) {
      currentTimeStamp = parseInt(new Date().getTime() / 1000);
    }

    // Get the user1 instance of privateStakePool
    let privateStakePoolUser1 = cheesePrivateStakePool.connect(user1);
    // Stak Cheese Token to CheesePrivateStakePool
    let stakeAmount = await privateStake(privateStakePoolUser1,100);
    expect(stakeAmount).to.equal("100");

  });

  it("Test function of calculateIncome", async function () {
    // Initial CheeseFactory 
    await cheeseFactory.initialize(
      cheesePrivateStakePool.address,
      cheeseStakePool.address,
      timestampBefore + 2
    );

    console.log(
      "Please be patient, it will take 8 seconds to do the calculateIncome"
    );

    let currentTimeStamp = parseInt(new Date().getTime() / 1000);
    let endTimeStamp = currentTimeStamp + 8;
    while (currentTimeStamp <= endTimeStamp) {
      currentTimeStamp = parseInt(new Date().getTime() / 1000);
    }

    // Get the user1 instance of privateStakePool
    let privateStakePoolUser1 = cheesePrivateStakePool.connect(user1);
    // Stak fUSD Token to CheesePrivateStakePool
    let stakeAmount = await privateStake(privateStakePoolUser1,100);

    expect(stakeAmount).to.equal("100");

    console.log(
      "Please be patient, Before check the income , it will take 8 seconds to wait for poolMint"
    );

    currentTimeStamp = parseInt(new Date().getTime() / 1000);
    endTimeStamp = currentTimeStamp + 8;
    while (currentTimeStamp <= endTimeStamp) {
      currentTimeStamp = parseInt(new Date().getTime() / 1000);
    }

    let income = await privateStakePoolUser1.calculateIncome(user1.address);
    expect(income.toString()).to.equal("6000000000000000000000");
  });
});
