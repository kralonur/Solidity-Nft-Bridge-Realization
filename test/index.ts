import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { ERC721Nft, ERC721Nft__factory, Bridge, Bridge__factory } from "../typechain-types";


describe("Bridge", function () {
  let accounts: SignerWithAddress[];
  let owner: SignerWithAddress;
  let ethBridge: Bridge;
  let bscBridge: Bridge;
  let ethNftContract: ERC721Nft;
  let bscNftContract: ERC721Nft;
  const MINTER_ROLE = ethers.utils.id("MINTER_ROLE");
  const ethChainId = 31337; //Chain id for test
  const bscChainId = 97; //BSC Testnet

  before(async function () {
    accounts = await ethers.getSigners();
    owner = accounts[0];
  });

  beforeEach(async function () {
    ethNftContract = await getTokenContract(owner);
    ethBridge = await getBridgeContract(owner, ethNftContract.address, owner.address);

    bscNftContract = await getTokenContract(owner);
    bscBridge = await getBridgeContract(owner, bscNftContract.address, owner.address);

    await bscNftContract.grantRole(MINTER_ROLE, bscBridge.address);
  });

  it("Should add chain", async () => {
    await expect(ethBridge.connect(accounts[1]).addChain(bscChainId))
      .to.be.revertedWith("Ownable: caller is not the owner");

    await expect(ethBridge.addChain(bscChainId))
      .to.emit(ethBridge, "ChainAdded")
      .withArgs(bscChainId);
  });

  it("Should remove chain", async () => {
    await expect(ethBridge.connect(accounts[1]).removeChain(bscChainId))
      .to.be.revertedWith("Ownable: caller is not the owner");

    await expect(ethBridge.removeChain(bscChainId))
      .to.emit(ethBridge, "ChainRemoved")
      .withArgs(bscChainId);
  });

  it("Should swap", async () => {
    const tokenId = 0
    const tokenURI = "https://example.com/item-id-0.json";
    const nonce = 1

    await ethNftContract["mint(address,string)"](accounts[1].address, tokenURI);
    await ethNftContract["mint(address,string)"](owner.address, tokenURI); //mint one for owner (id=1)

    await expect(ethBridge.connect(accounts[1]).swap(tokenId, bscChainId, nonce))
      .to.be.revertedWith("Given chain is not supported");

    await ethBridge.addChain(bscChainId);

    await expect(ethBridge.connect(accounts[1]).swap(tokenId, bscChainId, nonce))
      .to.be.revertedWith("ERC721: transfer caller is not owner nor approved");

    await ethNftContract.connect(accounts[1]).approve(ethBridge.address, tokenId);

    await expect(ethBridge.connect(accounts[1]).swap(1, bscChainId, nonce))
      .to.be.revertedWith("You are not the owner of the token");

    await expect(ethBridge.connect(accounts[1]).swap(tokenId, bscChainId, nonce))
      .to.emit(ethBridge, "SwapInitialized")
      .withArgs(tokenId, accounts[1].address, bscChainId, nonce, tokenURI)
      .and.to.emit(ethNftContract, "Transfer")
      .withArgs(accounts[1].address, ethBridge.address, tokenId);

  });

  it("Should redeem", async () => {
    const tokenId = 0
    const tokenURI = "https://example.com/item-id-0.json";
    const nonce = 1

    await ethNftContract["mint(address,string)"](accounts[1].address, tokenURI);
    await ethBridge.addChain(bscChainId);
    await ethNftContract.connect(accounts[1]).approve(ethBridge.address, tokenId);
    await expect(ethBridge.connect(accounts[1]).swap(tokenId, bscChainId, nonce))
      .to.emit(ethBridge, "SwapInitialized")
      .withArgs(tokenId, accounts[1].address, bscChainId, nonce, tokenURI)
      .and.to.emit(ethNftContract, "Transfer")
      .withArgs(accounts[1].address, ethBridge.address, tokenId);

    const hash = ethers.utils.solidityKeccak256(
      ["uint256", "address", "uint256", "uint256"],
      [tokenId, accounts[1].address, ethChainId, nonce]
    );
    const hashArray = ethers.utils.arrayify(hash);
    const signedMessage = await owner.signMessage(hashArray);
    const wrongSignedMessage = await accounts[1].signMessage(hashArray);
    const signature = ethers.utils.splitSignature(signedMessage);
    const wrongSignature = ethers.utils.splitSignature(wrongSignedMessage);

    await expect(bscBridge.connect(accounts[1]).redeem(tokenId, accounts[1].address, ethChainId, nonce, tokenURI, signature.v, signature.r, signature.s))
      .to.be.revertedWith("You are not the validator");

    await expect(bscBridge.redeem(tokenId, accounts[1].address, ethChainId, nonce, tokenURI, signature.v, signature.r, signature.s))
      .to.be.revertedWith("Given chain is not supported");

    await bscBridge.addChain(ethChainId);

    await expect(bscBridge.redeem(tokenId, accounts[1].address, ethChainId, nonce, tokenURI, wrongSignature.v, wrongSignature.r, wrongSignature.s))
      .to.be.revertedWith("Invalid sign");

    await expect(bscBridge.redeem(tokenId, accounts[1].address, ethChainId, nonce, tokenURI, signature.v, signature.r, signature.s))
      .to.emit(bscBridge, "SwapRedeemed")
      .withArgs(tokenId, accounts[1].address, ethChainId, hash)
      .and.to.emit(bscNftContract, "Transfer")
      .withArgs(ethers.constants.AddressZero, accounts[1].address, tokenId);

    await expect(bscBridge.redeem(tokenId, accounts[1].address, ethChainId, nonce, tokenURI, signature.v, signature.r, signature.s))
      .to.be.revertedWith("You can not redeem token twice");


    // Simulate transfer already minted token
    const newHash = ethers.utils.solidityKeccak256(
      ["uint256", "address", "uint256", "uint256"],
      [2, accounts[1].address, ethChainId, nonce]
    );
    const newHashArray = ethers.utils.arrayify(newHash);
    const newSignedMessage = await owner.signMessage(newHashArray);
    const newSignature = ethers.utils.splitSignature(newSignedMessage);

    await bscNftContract["mint(address,string,uint256)"](bscBridge.address, tokenURI, 2);

    await expect(bscBridge.redeem(2, accounts[1].address, ethChainId, nonce, tokenURI, newSignature.v, newSignature.r, newSignature.s))
      .to.emit(bscBridge, "SwapRedeemed")
      .withArgs(2, accounts[1].address, ethChainId, newHash)
      .and.to.emit(bscNftContract, "Transfer")
      .withArgs(bscBridge.address, accounts[1].address, 2);

    expect(await bscBridge.isRedeemed(newHash))
      .to.equal(true);
  });
});

async function getTokenContract(owner: SignerWithAddress) {
  const tokenFactory = new ERC721Nft__factory(owner);
  const tokenContract = await tokenFactory.deploy();
  await tokenContract.deployed();

  return tokenContract;
}

async function getBridgeContract(owner: SignerWithAddress, nftContractAddress: string, validatorAddress: string) {
  const tokenFactory = new Bridge__factory(owner);
  const tokenContract = await tokenFactory.deploy(nftContractAddress, validatorAddress);
  await tokenContract.deployed();

  return tokenContract;
}