import { useEffect, useState, type SyntheticEvent } from "react";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import { taskRegistryAbi } from "../abi/taskRegistryAbi";
import { contracts } from "../config/contracts";

type CreateTaskFormProps = {
  onTaskCreated: () => void;
};

export function CreateTaskForm({ onTaskCreated }: CreateTaskFormProps) {
  const { isConnected } = useAccount();
  const [title, setTitle] = useState("");

  const { data: hash, error, isPending, writeContract } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  useEffect(() => {
    if (isConfirmed) {
      onTaskCreated();
    }
  }, [isConfirmed, onTaskCreated]);

  function handleSubmit(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();

    const cleanedTitle = title.trim();

    if (!cleanedTitle) {
      alert("Task title is required");
      return;
    }

    writeContract({
      address: contracts.taskRegistry,
      abi: taskRegistryAbi,
      functionName: "createTask",
      args: [cleanedTitle],
    });

    setTitle("");
  }

  return (
    <section className="card create-task-card">
      <h2>Create Task</h2>

      <div className="create-task-body">
        <form onSubmit={handleSubmit} className="form">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Example: Learn wagmi contract writes"
            disabled={!isConnected || isPending || isConfirming}
          />

          <button disabled={!isConnected || isPending || isConfirming}>
            {isPending
              ? "Waiting for wallet..."
              : isConfirming
              ? "Confirming..."
              : "Create Task"}
          </button>
        </form>

        {hash && (
          <p className="muted">
            Transaction hash: <span className="mono">{hash}</span>
          </p>
        )}

        {isConfirmed && <p className="success">Task created successfully.</p>}

        {error && <p className="error">{error.message}</p>}
      </div>
    </section>
  );
}
