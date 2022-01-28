import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ERC721Nft, ERC721Nft__factory } from "../typechain-types";

task("mint", "Mints an ERC721 token")
    .addParam("contract", "The address of the contract")
    .addParam("tokenowner", "The owner for the created token")
    .addParam("tokenuri", "The URI for the created token")
    .setAction(async (taskArgs, hre) => {
        const contract: ERC721Nft = await getTokenContract(hre, taskArgs.contract);
        await contract["mint(address,string)"](taskArgs.tokenowner, taskArgs.tokenuri);
        console.log("Created an token for: " + taskArgs.tokenowner + " with auto id");
    });

task("mint-with-id", "Mints an ERC721 token with id")
    .addParam("contract", "The address of the contract")
    .addParam("tokenowner", "The owner for the created token")
    .addParam("tokenuri", "The URI for the created token")
    .addParam("tokenid", "The id for the created token")
    .setAction(async (taskArgs, hre) => {
        const contract: ERC721Nft = await getTokenContract(hre, taskArgs.contract);
        await contract["mint(address,string,uint256)"](taskArgs.tokenowner, taskArgs.tokenuri, taskArgs.tokenid);
        console.log("Created an token for: " + taskArgs.tokenowner + " with id: " + taskArgs.tokenid);
    });

task("approve", "Approves an ERC721 token")
    .addParam("contract", "The address of the contract")
    .addParam("tokenid", "The id for the token to approve")
    .addParam("approveto", "The address to approve token to")
    .setAction(async (taskArgs, hre) => {
        const contract: ERC721Nft = await getTokenContract(hre, taskArgs.contract);
        await contract.approve(taskArgs.approveto, taskArgs.tokenid);
        console.log("Token id: " + taskArgs.tokenid + " approved to: " + taskArgs.approveto);
    });

task("burn", "Burns an ERC721 token")
    .addParam("contract", "The address of the contract")
    .addParam("tokenid", "The id for the burned token")
    .setAction(async (taskArgs, hre) => {
        const contract: ERC721Nft = await getTokenContract(hre, taskArgs.contract);
        await contract.burn(taskArgs.tokenid);
        console.log("Burned token id: " + taskArgs.tokenid);
    });

task("exists", "Checks an ERC721 token exists")
    .addParam("contract", "The address of the contract")
    .addParam("tokenid", "The id for the token to check")
    .setAction(async (taskArgs, hre) => {
        const contract: ERC721Nft = await getTokenContract(hre, taskArgs.contract);
        const result = await contract.exists(taskArgs.tokenid);
        console.log("Check result: " + result);
    });

async function getTokenContract(hre: HardhatRuntimeEnvironment, contractAddress: string) {
    const MyContract: ERC721Nft__factory = <ERC721Nft__factory>await hre.ethers.getContractFactory("ERC721Nft__factory");
    const contract: ERC721Nft = MyContract.attach(contractAddress);
    return contract;
}
