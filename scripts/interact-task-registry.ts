import { network } from "hardhat";
import fs from "node:fs";
import path from "node:path";

const { ethers, networkName } = await network.create();

const deploymentFilePath = path.join(
  process.cwd(),
  "deployments",
  `${networkName}.json`,
);

if (!fs.existsSync(deploymentFilePath)) {
  throw new Error(
    `Deployment file not found: ${deploymentFilePath}. Run the deploy script first.`,
  );
}

const deploymentData = JSON.parse(fs.readFileSync(deploymentFilePath, "utf8"));

const [deployer, userOne] = await ethers.getSigners();

console.log("Network:", networkName);
console.log("Contract address:", deploymentData.address);
console.log("Deployer:", deployer.address);
console.log("User One:", userOne.address);
console.log("");

const taskRegistry = await ethers.getContractAt(
  "TaskRegistry",
  deploymentData.address,
);

console.log("=== Initial Contract State ===");

const owner = await taskRegistry.owner();
const nextTaskIdBefore = await taskRegistry.nextTaskId();

console.log("Owner:", owner);
console.log("Next Task ID:", nextTaskIdBefore.toString());
console.log("");

console.log("=== Creating Task as Deployer ===");

const createTaskTx = await taskRegistry.createTask("Learn Hardhat");

console.log("Create task tx hash:", createTaskTx.hash);
console.log("Waiting for create task confirmation...");

const createTaskReceipt = await createTaskTx.wait();

console.log("Create task confirmed in block:", createTaskReceipt?.blockNumber);
console.log("");

console.log("=== Reading Created Task ===");

const task = await taskRegistry.getTask(nextTaskIdBefore);

console.log("Task ID:", task.id.toString());
console.log("Creator:", task.creator);
console.log("Title:", task.title);
console.log("Completed:", task.completed);
console.log("Created At:", task.createdAt.toString());
console.log("");

console.log("=== Completing Task as Deployer ===");

const completeTaskTx = await taskRegistry.completeTask(nextTaskIdBefore);

console.log("Complete task tx hash:", completeTaskTx.hash);
console.log("Waiting for complete task confirmation...");

const completeTaskReceipt = await completeTaskTx.wait();

console.log(
  "Complete task confirmed in block:",
  completeTaskReceipt?.blockNumber,
);
console.log("");

console.log("=== Reading Updated Task ===");

const updatedTask = await taskRegistry.getTask(nextTaskIdBefore);

console.log("Task ID:", updatedTask.id.toString());
console.log("Creator:", updatedTask.creator);
console.log("Title:", updatedTask.title);
console.log("Completed:", updatedTask.completed);
console.log("");

console.log("=== Reading Task IDs By User ===");

const deployerTaskIds = await taskRegistry.getTaskIdsByUser(deployer.address);

console.log(
  "Deployer task IDs:",
  deployerTaskIds.map((id) => id.toString()),
);
console.log("");

console.log("=== Trying Unauthorized Action ===");

try {
  await taskRegistry.connect(userOne).completeTask(nextTaskIdBefore);
} catch (error) {
  console.log("User One failed to complete deployer's task, as expected.");
}

console.log("");
console.log("Interaction completed successfully.");
