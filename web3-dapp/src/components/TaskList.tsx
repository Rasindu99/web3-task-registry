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

type ActionIconProps = {
  kind: "complete" | "trash";
};

function ActionIcon({ kind }: ActionIconProps) {
  if (kind === "trash") {
    return (
      <svg
        className="action-icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M9 3.75h6l.75 1.5H19.5a.75.75 0 0 1 0 1.5h-.93l-.72 11.02a2.25 2.25 0 0 1-2.24 2.1H8.39a2.25 2.25 0 0 1-2.24-2.1L5.43 6.75H4.5a.75.75 0 0 1 0-1.5h3.75L9 3.75Zm-2.07 3 .72 10.92a.75.75 0 0 0 .74.7h7.22a.75.75 0 0 0 .74-.7l.72-10.92H6.93Zm3.32 2.25c.41 0 .75.34.75.75v5.25a.75.75 0 0 1-1.5 0V9.75c0-.41.34-.75.75-.75Zm3.5 0c.41 0 .75.34.75.75v5.25a.75.75 0 0 1-1.5 0V9.75c0-.41.34-.75.75-.75Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  return (
    <svg
      className="action-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm0 1.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Zm3.28 4.97a.75.75 0 0 1 .06 1.06l-3.75 4.2a.75.75 0 0 1-1.08.03l-1.88-1.88a.75.75 0 1 1 1.06-1.06l1.32 1.32 3.22-3.61a.75.75 0 0 1 1.05-.06Z"
        fill="currentColor"
      />
    </svg>
  );
}

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
  }, [isCompleteConfirmed, isDeleteConfirmed, refetchTaskIds, refetchTasks]);

  if (!isConnected) {
    return (
      <section className="card task-card">
        <div>
          <h2>Your Tasks</h2>
          <p className="section-intro">
            Your created tasks appear here after your wallet is connected.
          </p>
        </div>
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
    ? (taskResults
        ?.filter((result) => result.status === "success")
        .flatMap((result) => {
          const task = asTask(result.result);
          return task ? [task] : [];
        }) ?? [])
    : [];

  return (
    <section className="card task-card">
      <div className="card-header">
        <div>
          <h2>Your Tasks</h2>
          <p className="section-intro">
            Track status, refresh on-chain data, and manage your items.
          </p>
        </div>
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

      <div className="task-list">
        {!isLoadingTaskIds && tasks.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-title">No tasks yet</p>
            <p className="muted">
              Create your first task from the panel on the left. It will appear
              here once the transaction is confirmed.
            </p>
          </div>
        ) : null}

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
            <article
              key={task.id.toString()}
              className={`task-item ${task.completed ? "task-item-complete" : "task-item-pending"}`}
            >
              <div className="task-main">
                <h3>{task.title}</h3>
                <p className="muted">Task ID: {task.id.toString()}</p>
                <p
                  className={
                    task.completed
                      ? "status-badge success"
                      : "status-badge warning"
                  }
                >
                  {task.completed ? "Completed" : "Pending"}
                </p>
              </div>

              {isCreator && (
                <div className="task-actions">
                  {!task.completed && (
                    <button
                      type="button"
                      className="task-action-button task-action-button-complete"
                      disabled={isCompletingThisTask || isDeletingThisTask}
                      onClick={() => handleCompleteTask(task.id)}
                      aria-label={
                        completingTaskId === task.id && isCompletePending
                          ? "Waiting to complete task"
                          : completingTaskId === task.id && isCompleteConfirming
                            ? "Confirming task completion"
                            : "Complete task"
                      }
                      title={
                        completingTaskId === task.id && isCompletePending
                          ? "Waiting..."
                          : completingTaskId === task.id && isCompleteConfirming
                            ? "Confirming..."
                            : "Complete task"
                      }
                    >
                      <ActionIcon kind="complete" />
                    </button>
                  )}

                  <button
                    type="button"
                    className="task-action-button task-action-button-delete"
                    disabled={isDeletingThisTask || isCompletingThisTask}
                    onClick={() => handleDeleteTask(task.id)}
                  >
                    <ActionIcon kind="trash" />
                    {deletingTaskId === task.id && isDeletePending
                      ? "Waiting..."
                      : deletingTaskId === task.id && isDeleteConfirming
                        ? "Confirming..."
                        : ""}
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {completeHash && (
        <p className="muted hash-line">
          Complete tx hash: <span className="mono">{completeHash}</span>
        </p>
      )}

      {completeError && <p className="error">{completeError.message}</p>}

      {deleteHash && (
        <p className="muted hash-line">
          Delete tx hash: <span className="mono">{deleteHash}</span>
        </p>
      )}

      {deleteError && <p className="error">{deleteError.message}</p>}
    </section>
  );
}
