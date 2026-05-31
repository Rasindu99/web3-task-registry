import { expect } from "chai";
import hre from "hardhat";

const { ethers } = await hre.network.create();

describe("TaskRegistry", function () {
  async function deployTaskRegistry() {
    const [owner, userOne, userTwo] = await ethers.getSigners();

    const taskRegistry = await ethers.deployContract("TaskRegistry");

    return {
      taskRegistry,
      owner,
      userOne,
      userTwo,
    };
  }

  it("should set deployer as owner", async function () {
    const { taskRegistry, owner } = await deployTaskRegistry();

    expect(await taskRegistry.owner()).to.equal(owner.address);
  });

  it("should create a task", async function () {
    const { taskRegistry, owner } = await deployTaskRegistry();

    await taskRegistry.createTask("Learn Solidity");

    const task = await taskRegistry.getTask(0);

    expect(task.id).to.equal(0n);
    expect(task.creator).to.equal(owner.address);
    expect(task.title).to.equal("Learn Solidity");
    expect(task.completed).to.equal(false);
  });

  it("should increment nextTaskId after creating a task", async function () {
    const { taskRegistry } = await deployTaskRegistry();

    expect(await taskRegistry.nextTaskId()).to.equal(0n);

    await taskRegistry.createTask("First task");

    expect(await taskRegistry.nextTaskId()).to.equal(1n);
  });

  it("should emit TaskCreated event", async function () {
    const { taskRegistry, owner } = await deployTaskRegistry();

    await expect(taskRegistry.createTask("Learn Hardhat"))
      .to.emit(taskRegistry, "TaskCreated")
      .withArgs(0n, owner.address, "Learn Hardhat");
  });

  it("should store task id under creator address", async function () {
    const { taskRegistry, owner } = await deployTaskRegistry();

    await taskRegistry.createTask("Task A");
    await taskRegistry.createTask("Task B");

    const taskIds = await taskRegistry.getTaskIdsByUser(owner.address);

    expect(taskIds.length).to.equal(2);
    expect(taskIds[0]).to.equal(0n);
    expect(taskIds[1]).to.equal(1n);
  });

  it("should complete own task", async function () {
    const { taskRegistry } = await deployTaskRegistry();

    await taskRegistry.createTask("Complete me");

    await taskRegistry.completeTask(0);

    const task = await taskRegistry.getTask(0);

    expect(task.completed).to.equal(true);
  });

  it("should emit TaskCompleted event", async function () {
    const { taskRegistry, owner } = await deployTaskRegistry();

    await taskRegistry.createTask("Event test");

    await expect(taskRegistry.completeTask(0))
      .to.emit(taskRegistry, "TaskCompleted")
      .withArgs(0n, owner.address);
  });

  it("should update own task title", async function () {
    const { taskRegistry } = await deployTaskRegistry();

    await taskRegistry.createTask("Old title");

    await taskRegistry.updateTaskTitle(0, "New title");

    const task = await taskRegistry.getTask(0);

    expect(task.title).to.equal("New title");
  });

  it("should emit TaskUpdated event", async function () {
    const { taskRegistry, owner } = await deployTaskRegistry();

    await taskRegistry.createTask("Old title");

    await expect(taskRegistry.updateTaskTitle(0, "Updated title"))
      .to.emit(taskRegistry, "TaskUpdated")
      .withArgs(0n, owner.address, "Updated title");
  });

  it("should revert when creating task with empty title", async function () {
    const { taskRegistry } = await deployTaskRegistry();

    await expect(taskRegistry.createTask("")).to.be.revertedWithCustomError(
      taskRegistry,
      "EmptyTitle",
    );
  });

  it("should revert when reading non-existing task", async function () {
    const { taskRegistry } = await deployTaskRegistry();

    await expect(taskRegistry.getTask(999)).to.be.revertedWithCustomError(
      taskRegistry,
      "TaskNotFound",
    );
  });

  it("should revert when completing non-existing task", async function () {
    const { taskRegistry } = await deployTaskRegistry();

    await expect(taskRegistry.completeTask(999)).to.be.revertedWithCustomError(
      taskRegistry,
      "TaskNotFound",
    );
  });

  it("should revert when another user tries to complete someone else's task", async function () {
    const { taskRegistry, userOne } = await deployTaskRegistry();

    await taskRegistry.createTask("Private task");

    await expect(
      taskRegistry.connect(userOne).completeTask(0),
    ).to.be.revertedWithCustomError(taskRegistry, "NotTaskCreator");
  });
});
