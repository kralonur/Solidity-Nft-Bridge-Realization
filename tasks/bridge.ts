import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Bridge, Bridge__factory } from "../typechain-types";

task("add-chain", "Adds chain to the bridge")
    .addParam("contract", "The address of the contract")
    .addParam("chainid", "The id of chain to add")
    .setAction(async (taskArgs, hre) => {
        const contract: Bridge = await getBridgeContract(hre, taskArgs.contract);
        await contract.addChain(taskArgs.chainid);
        console.log("Added chain id: " + taskArgs.chainid);
    });

task("remove-chain", "Removes chain to the bridge")
    .addParam("contract", "The address of the contract")
    .addParam("chainid", "The id of chain to remove")
    .setAction(async (taskArgs, hre) => {
        const contract: Bridge = await getBridgeContract(hre, taskArgs.contract);
        await contract.removeChain(taskArgs.chainid);
        console.log("Removed chain id: " + taskArgs.chainid);
    });

task("swap", "Swaps token to another chain")
    .addParam("contract", "The address of the contract")
    .addParam("tokenid", "The id of the token to swap")
    .addParam("chainswapto", "The id of chain to send token")
    .addParam("nonce", "The nonce")
    .setAction(async (taskArgs, hre) => {
        const contract: Bridge = await getBridgeContract(hre, taskArgs.contract);
        await contract.swap(taskArgs.tokenid, taskArgs.chainswapto, taskArgs.nonce);
        console.log("Swapped token id: " + taskArgs.tokenid + " send to chain: " + taskArgs.chainswapto);
    });

async function getBridgeContract(hre: HardhatRuntimeEnvironment, contractAddress: string) {
    const MyContract: Bridge__factory = <Bridge__factory>await hre.ethers.getContractFactory("Bridge__factory");
    const contract: Bridge = MyContract.attach(contractAddress);
    return contract;
}
