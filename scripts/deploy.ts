import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ERC721Nft, ERC721Nft__factory, Bridge, Bridge__factory } from "../typechain-types";

async function main() {
  const [owner] = await ethers.getSigners();
  const nftContract = await getTokenContract(owner);
  const bridge = await getBridgeContract(owner, nftContract.address, owner.address);

  console.log("nftContract deployed to:", nftContract.address);
  console.log("bridge deployed to:", bridge.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
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
