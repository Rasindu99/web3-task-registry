import { network } from "hardhat";
import fs from "node:fs";
import path from "node:path";

const { ethers, networkName } = await network.create();

console.log(`Deploying TaskRegistry to ${networkName}...`);

const [deployer] = await ethers.getSigners();

console.log("Deployer address:", deployer.address);

const taskRegistry = await ethers.deployContract("TaskRegistry");

console.log("Waiting for deployment transaction to confirm...");

await taskRegistry.waitForDeployment();

const contractAddress = await taskRegistry.getAddress();

console.log("TaskRegistry deployed successfully.");
console.log("Contract address:", contractAddress);

const deploymentData = {
  network: networkName,
  contractName: "TaskRegistry",
  address: contractAddress,
  deployer: deployer.address,
  deployedAt: new Date().toISOString(),
};

const deploymentsDir = path.join(process.cwd(), "deployments");
const deploymentFilePath = path.join(deploymentsDir, `${networkName}.json`);

fs.mkdirSync(deploymentsDir, { recursive: true });
fs.writeFileSync(deploymentFilePath, JSON.stringify(deploymentData, null, 2));

console.log(`Deployment saved to ${deploymentFilePath}`);
