// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TaskRegistry {
    uint256 public nextTaskId;
    address public owner;

    struct Task {
        uint256 id;
        address creator;
        string title;
        bool completed;
        uint256 createdAt;
    }

    mapping(uint256 => Task) private tasks;
    mapping(address => uint256[]) private userTaskIds;

    event TaskCreated(
        uint256 indexed taskId,
        address indexed creator,
        string title
    );

    event TaskCompleted(
        uint256 indexed taskId,
        address indexed creator
    );

    event TaskUpdated(
        uint256 indexed taskId,
        address indexed creator,
        string newTitle
    );

    event TaskDeleted(
        uint256 indexed taskId,
        address indexed creator
    );

    error EmptyTitle();
    error TaskNotFound();
    error NotTaskCreator();

    constructor() {
        owner = msg.sender;
    }

    function _removeTaskIdFromUser(address user, uint256 taskId) internal {
        uint256[] storage taskIds = userTaskIds[user];

        for (uint256 i = 0; i < taskIds.length; i++) {
            if (taskIds[i] == taskId) {
                taskIds[i] = taskIds[taskIds.length - 1];
                taskIds.pop();
                return;
            }
        }
    }

    function createTask(string calldata title) external returns (uint256 taskId) {
        if (bytes(title).length == 0) {
            revert EmptyTitle();
        }

        taskId = nextTaskId;

        tasks[taskId] = Task({
            id: taskId,
            creator: msg.sender,
            title: title,
            completed: false,
            createdAt: block.timestamp
        });

        userTaskIds[msg.sender].push(taskId);
        nextTaskId++;

        emit TaskCreated(taskId, msg.sender, title);
    }

    function updateTaskTitle(uint256 taskId, string calldata newTitle) external {
      Task storage task = tasks[taskId];

      if(task.creator == address(0)) {
        revert TaskNotFound();
      }

      if(task.creator != msg.sender) {
        revert NotTaskCreator();
      }

      if(bytes(newTitle).length == 0 ) {
        revert EmptyTitle();
      }

      task.title = newTitle;

      emit TaskUpdated(taskId, msg.sender, newTitle);
    }

    function completeTask(uint256 taskId) external {
        Task storage task = tasks[taskId];

        if (task.creator == address(0)) {
            revert TaskNotFound();
        }

        if (task.creator != msg.sender) {
            revert NotTaskCreator();
        }

        task.completed = true;

        emit TaskCompleted(taskId, msg.sender);
    }

    function deleteTask(uint256 taskId) external {
        Task storage task = tasks[taskId];

        if (task.creator == address(0)) {
            revert TaskNotFound();
        }

        if (task.creator != msg.sender) {
            revert NotTaskCreator();
        }

        _removeTaskIdFromUser(msg.sender, taskId);

        delete tasks[taskId];

        emit TaskDeleted(taskId, msg.sender);
    }

    function getTask(uint256 taskId) external view returns (Task memory) {
        Task memory task = tasks[taskId];

        if (task.creator == address(0)) {
            revert TaskNotFound();
        }

        return task;
    }

    function getMyTaskIds() external view returns (uint256[] memory) {
        return userTaskIds[msg.sender];
    }

    function getTaskIdsByUser(address user) external view returns (uint256[] memory) {
        return userTaskIds[user];
    }
}