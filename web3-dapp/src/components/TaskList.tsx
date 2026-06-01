import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { useEffect, useState } from "react";

import { taskRegistryAbi } from "../abi/taskRegistryAbi";
import { contracts } from "../config/contracts";

type TaskListProps = {
  refreshKey: number;
};

type Task = {
  id: bigint;
  creator: string;
  title: string;
  completed: boolean;
  createdAt: bigint;
};

export function TaskList({ refreshKey }: TaskListProps) {
  const { address, isConnected } = useAccount();
  const [completingTaskId, setCompletingTaskId] = useState<bigint | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<bigint | null>(null);

  const {
    data: taskIds,
    isLoading: isLoadingTaskIds,
    refetch: refetchTaskIds,
  } = useReadContract({
    address: contracts.taskRegistry,
    abi: taskRegistryAbi,
    functionName: "getTaskIdsByUser",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address),
    },
  });

  const taskContracts =
    taskIds?.map((taskId) => ({
      address: contracts.taskRegistry,
      abi: taskRegistryAbi,
      functionName: "getTask",
      args: [taskId],
    })) ?? [];

  const {
    data: taskResults,
    isLoading: isLoadingTasks,
    refetch: refetchTasks,
  } = useReadContracts({
    allowFailure: true,
    contracts: taskContracts,
    query: {
      enabled: Boolean(taskIds && taskIds.length > 0),
    },
  });

  const {
    data: completeHash,
    error: completeError,
    isPending: isCompletePending,
    writeContract: writeCompleteContract,
  } = useWriteContract();

  const {
    data: deleteHash,
    error: deleteError,
    isPending: isDeletePending,
    writeContract: writeDeleteContract,
  } = useWriteContract();

  const { isLoading: isCompleteConfirming, isSuccess: isCompleteConfirmed } =
    useWaitForTransactionReceipt({
      hash: completeHash,
    });

  const { isLoading: isDeleteConfirming, isSuccess: isDeleteConfirmed } =
    useWaitForTransactionReceipt({
      hash: deleteHash,
    });

  async function handleCompleteTask(taskId: bigint) {
    setCompletingTaskId(taskId);

    writeCompleteContract({
      address: contracts.taskRegistry,
      abi: taskRegistryAbi,
      functionName: "completeTask",
      args: [taskId],
    });
  }

  async function handleDeleteTask(taskId: bigint) {
    const ok = window.confirm("Delete this task? This cannot be undone.");
    if (!ok) return;

    setDeletingTaskId(taskId);

    writeDeleteContract({
      address: contracts.taskRegistry,
      abi: taskRegistryAbi,
      functionName: "deleteTask",
      args: [taskId],
    });
  }

  useEffect(() => {
    if (!isConnected) return;

    refetchTaskIds();
  }, [refreshKey, isConnected, refetchTaskIds]);

  useEffect(() => {
    if (!isCompleteConfirmed && !isDeleteConfirmed) return;

    refetchTaskIds();
    refetchTasks();
    setCompletingTaskId(null);
    setDeletingTaskId(null);
  }, [isCompleteConfirmed, isDeleteConfirmed, refetchTaskIds, refetchTasks]);

  if (!isConnected) {
    return (
      <section className="card task-card">
        <h2>Your Tasks</h2>
        <p>Connect your wallet to view your tasks.</p>
      </section>
    );
  }

  function asTask(value: unknown): Task | null {
    if (!value) return null;

    if (typeof value === "object") {
      const maybeTask = value as Partial<Task>;
      if (
        typeof maybeTask.creator === "string" &&
        typeof maybeTask.title === "string" &&
        typeof maybeTask.completed === "boolean" &&
        typeof maybeTask.id === "bigint" &&
        typeof maybeTask.createdAt === "bigint"
      ) {
        return maybeTask as Task;
      }
    }

    if (Array.isArray(value) && value.length >= 5) {
      const [id, creator, title, completed, createdAt] = value;
      if (
        typeof creator === "string" &&
        typeof title === "string" &&
        typeof completed === "boolean" &&
        typeof id === "bigint" &&
        typeof createdAt === "bigint"
      ) {
        return { id, creator, title, completed, createdAt };
      }
    }

    return null;
  }

  const tasks = taskIds?.length
    ? taskResults
        ?.filter((result) => result.status === "success")
        .flatMap((result) => {
          const task = asTask(result.result);
          return task ? [task] : [];
        }) ?? []
    : [];

  return (
    <section className="card task-card">
      <div className="card-header">
        <h2>Your Tasks</h2>
        <button
          type="button"
          onClick={() => {
            refetchTaskIds();
            refetchTasks();
          }}
        >
          Refresh
        </button>
      </div>

      {isLoadingTaskIds || isLoadingTasks ? <p>Loading tasks...</p> : null}

      {!isLoadingTaskIds && tasks.length === 0 ? (
        <p>No tasks found for this wallet yet.</p>
      ) : null}

      <div className="task-list">
        {tasks.map((task) => {
          const addressLower = address?.toLowerCase();
          const isCreator =
            Boolean(addressLower) &&
            task.creator.toLowerCase() === addressLower;
          const isCompletingThisTask =
            completingTaskId === task.id &&
            (isCompletePending || isCompleteConfirming);
          const isDeletingThisTask =
            deletingTaskId === task.id &&
            (isDeletePending || isDeleteConfirming);

          return (
            <article key={task.id.toString()} className="task-item">
              <div>
                <h3>{task.title}</h3>
                <p className="muted">Task ID: {task.id.toString()}</p>
                <p className={task.completed ? "success" : "warning"}>
                  {task.completed ? "Completed" : "Pending"}
                </p>
              </div>

              {isCreator && (
                <div className="task-actions">
                  {!task.completed && (
                    <button
                      type="button"
                      disabled={isCompletingThisTask || isDeletingThisTask}
                      onClick={() => handleCompleteTask(task.id)}
                    >
                      {completingTaskId === task.id && isCompletePending
                        ? "Waiting..."
                        : completingTaskId === task.id && isCompleteConfirming
                        ? "Confirming..."
                        : "Complete"}
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isDeletingThisTask || isCompletingThisTask}
                    onClick={() => handleDeleteTask(task.id)}
                  >
                    {deletingTaskId === task.id && isDeletePending
                      ? "Waiting..."
                      : deletingTaskId === task.id && isDeleteConfirming
                      ? "Confirming..."
                      : "Delete"}
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {completeHash && (
        <p className="muted">
          Complete tx hash: <span className="mono">{completeHash}</span>
        </p>
      )}

      {completeError && <p className="error">{completeError.message}</p>}

      {deleteHash && (
        <p className="muted">
          Delete tx hash: <span className="mono">{deleteHash}</span>
        </p>
      )}

      {deleteError && <p className="error">{deleteError.message}</p>}
    </section>
  );
}
