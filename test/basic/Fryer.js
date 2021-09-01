const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;

async function setOven(fryer, ovenAddress) {
  // Call the contract, getting back the transaction
  let transaction = await fryer.setOven(ovenAddress);

  // regarding the number of suggested confirmations
  let receipt = await transaction.wait();

  let abi = ["event OvenUpdated(address indexed newOven)"];

  let iface = new ethers.utils.Interface(abi);

  let ovenAddressNew = iface.parseLog(receipt.logs[0]).args.newOven.toString();

  return ovenAddressNew;
}

async function tokensLiquidated(fry,amount) {
  let transaction = await fry.liquidate(amount);

  // regarding the number of suggested confirmations
  let receipt = await transaction.wait();

  let abi = [
    "event TokensLiquidated(address indexed user,uint256 indexed amount,uint256 withdrawnAmount,uint256 decreasedValue)",
  ];

  let iface = new ethers.utils.Interface(abi);

  for(var log of receipt.logs){
    if (log.topics.includes('0x3ea051727656be6fd11c2260f244f29ff3c70d1fb077bfa73e89d554e9bb95c7')) {
      let withdrawnAmount = iface.parseLog(log).args.withdrawnAmount;
      let decreasedValue = iface.parseLog(log).args.decreasedValue;

      return {withdrawnAmount,decreasedValue};
    }
  }
}

describe("Fryer contract", function () {
  let fryerConfig;
  let daiToken;
  let friesToken;
  let fryer;
  let oven;
  let yearnControllerMock;
  let yearnVaultMock;
  let yearnVaultAdapter;
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

    // Mock Dai Token
    let daiTokenFactory = await ethers.getContractFactory("Token");
    daiToken = await daiTokenFactory.deploy("Dai", "Dai", 18, 100000);
    await daiToken.deployed();

    // Deploy FriesToken
    let friesTokenFactory = await ethers.getContractFactory("FriesToken");
    friesToken = await friesTokenFactory.deploy();
    await friesToken.deployed();

    // Deploy Fryer
    let fryerFactory = await ethers.getContractFactory("Fryer");
    fryer = await fryerFactory.deploy(
      daiToken.address,
      friesToken.address,
      fryerConfig.address
    );
    await fryer.deployed();

    // Set friesToken whitelist
    await friesToken.setWhitelist(fryer.address,true);

    // Set Decimals
    await friesToken.setWhitelist(fryer.address,true);

    // Deploy Oven
    let ovenFactory = await ethers.getContractFactory("Oven");
    oven = await ovenFactory.deploy(friesToken.address, daiToken.address);
    await oven.deployed();

    // Set oven whitelist
    await oven.setWhitelist(fryer.address,true);

    // Deploy YearnControllerMock
    let yearnControllerMockFactory = await ethers.getContractFactory(
      "YearnControllerMock"
    );
    yearnControllerMock = await yearnControllerMockFactory.deploy();
    await yearnControllerMock.deployed();

    // Deploy YearnVaultMock
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

    // Set oven
    await fryer.setOven(oven.address);

    // Set reward
    await fryer.setRewards(user3.address);

    // Initial 
    await fryer.initialize(yearnVaultAdapter.address);
  });

  it("Test the function of collateralizationLimit", async function () {
    let collateralizationLimit = await fryer.collateralizationLimit();

    // Check the result
    expect(collateralizationLimit.toString()).to.equal("2000000000000000000");
  });

  it("Test the function of migrate", async function () {
    // Deploy New YearnControllerMock
    let yearnControllerMockFactoryNew = await ethers.getContractFactory(
      "YearnControllerMock"
    );
    let yearnControllerMockNew = await yearnControllerMockFactoryNew.deploy();
    await yearnControllerMockNew.deployed();

    // Deploy New YearnVaultMock
    let yearnVaultMockFactoryNew = await ethers.getContractFactory(
      "YearnVaultMock"
    );
    let yearnVaultMockNew = await yearnVaultMockFactoryNew.deploy(
      daiToken.address,
      yearnControllerMockNew.address
    );
    await yearnVaultMockNew.deployed();

    // Deploy New YearnVaultAdapter
    let yearnVaultAdapterFactoryNew = await ethers.getContractFactory(
      "YearnVaultAdapter"
    );
    let yearnVaultAdapterNew = await yearnVaultAdapterFactoryNew.deploy(
      yearnVaultMockNew.address,
      godUser.address
    );
    await yearnVaultAdapterNew.deployed();

    // Initial 
    await fryer.migrate(yearnVaultAdapterNew.address);
  }); 

  it("Test the function of deposit", async function () {
    // Mint for user2
    await daiToken.mint(user2.address,1000);

    // User2 approve for transfer for fry
    let daiTokenUser2 = daiToken.connect(user2);
    await daiTokenUser2.approve(fryer.address,1000);

    // Check the balance
    let balanceOfUser2 = await daiTokenUser2.balanceOf(user2.address);
    expect(balanceOfUser2).to.equal(1000);

    // User2 do the deposit
    let fryerUser2 = fryer.connect(user2);
    await fryerUser2.deposit(100);

    // Check the balance
    let balanceOfFry = await daiToken.balanceOf(fryer.address);
    expect(balanceOfFry).to.equal(100);
  });

  it("Test the function of withdraw", async function () {
    // Mint for user2
    await daiToken.mint(user2.address,1000);

    // User2 approve for transfer for fry
    let daiTokenUser2 = daiToken.connect(user2);
    await daiTokenUser2.approve(fryer.address,1000);

    // Check the balance
    let balanceOfUser2 = await daiTokenUser2.balanceOf(user2.address);
    expect(balanceOfUser2).to.equal(1000);

    // User2 do the deposit
    let fryerUser2 = fryer.connect(user2);
    await fryerUser2.deposit(100);

    // Check the balance
    let balanceOfFry = await daiToken.balanceOf(fryer.address);
    expect(balanceOfFry).to.equal(100);

    // WithDraw 50
    await fryerUser2.withdraw(50);

    // Check the balance
    balanceOfFry = await daiToken.balanceOf(fryer.address);
    expect(balanceOfFry).to.equal(50);

    // WithDraw more than rest
    await expect(fryerUser2.withdraw(100)).to.be.revertedWith('SafeMath: division by zero');
  }); 

  it("Test the function of liquidate", async function () {
    let fryerUser2 = fryer.connect(user2);
    // Do the liquidate
    let {withdrawnAmount,decreasedValue} = await tokensLiquidated(fryerUser2,50);
    expect(withdrawnAmount).to.equal(0);
    expect(decreasedValue).to.equal(0);
  });

  it("Test the function of borrow and repay", async function () {
    // Mint for user2
    await daiToken.mint(user2.address,1000);

    // User2 approve for transfer daiToken for fry
    let daiTokenUser2 = daiToken.connect(user2);
    await daiTokenUser2.approve(fryer.address,1000);

    // User2 approve for transfer friesToken for friesToken
    let friesTokenUser2 = friesToken.connect(user2);
    await friesTokenUser2.approve(fryer.address,1000)

    // Check the balance
    let balanceOfUser2 = await daiTokenUser2.balanceOf(user2.address);
    expect(balanceOfUser2).to.equal(1000);

    // User2 do the deposit
    let fryerUser2 = fryer.connect(user2);
    await fryerUser2.deposit(100);

    // Set ceilling for fryer
    await friesToken.setCeiling(fryer.address,50);

    // Check ceiling
    expect(await friesToken.ceiling(fryer.address)).to.equal(50);

    // Do the borrow
    await fryerUser2.borrow(50);

    // Check the result
    expect(await fryerUser2.getCdpTotalDebt(user2.address)).to.equal(50);

    // Do the repay
    await fryerUser2.repay(20,20);

    // Check the result
    expect(await fryerUser2.getCdpTotalDebt(user2.address)).to.equal(10);
  }); 

  it("Test the function of harvest", async function () {
    // Mint for yearnVaultAdapter
    await daiToken.mint(yearnVaultAdapter.address,1000);

    // yearnVaultAdapter deposit to vault
    await yearnVaultAdapter.deposit(1000);

  });

});
