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
  const [validationMessage, setValidationMessage] = useState("");

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
      setValidationMessage("Add a short task description before creating it.");
      return;
    }

    setValidationMessage("");

    writeContract({
      address: contracts.taskRegistry,
      abi: taskRegistryAbi,
      functionName: "createTask",
      args: [cleanedTitle],
    });

    setTitle("");
  }

  const isFormBusy = isPending || isConfirming;
  const isSubmitDisabled = !isConnected || isFormBusy;
  const helperMessage = !isConnected
    ? "Connect your wallet to create a task."
    : "Describe one actionable task. Clear titles are easier to track on-chain.";

  return (
    <section className="card create-task-card">
      <h2>Create Task</h2>

      <div className="create-task-body">
        <form onSubmit={handleSubmit} className="form">
          <div className="field-group">
            <div className="field-label-row">
              <label className="field-label" htmlFor="task-title">
                Task details
              </label>
              <span className="field-count mono">{title.trim().length} chars</span>
            </div>

            <textarea
              id="task-title"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                if (validationMessage) {
                  setValidationMessage("");
                }
              }}
              placeholder="Example: Learn wagmi contract writes and submit a first end-to-end task on Sepolia."
              className="task-textarea"
              rows={5}
              disabled={isSubmitDisabled}
            />

            <button className="primary-action" disabled={isSubmitDisabled}>
              <span className="button-title">
                {isPending
                  ? "Waiting for wallet..."
                  : isConfirming
                    ? "Confirming task..."
                    : "Create Task"}
              </span>
              <span className="button-subtitle">
                {isConnected
                  ? "Send this task to the registry"
                  : "Wallet connection required"}
              </span>
            </button>

            <p className="muted field-help">{helperMessage}</p>
          </div>
        </form>

        {validationMessage && <p className="error">{validationMessage}</p>}

        {hash && (
          <p className="muted hash-line">
            Transaction hash: <span className="mono">{hash}</span>
          </p>
        )}

        {isConfirmed && <p className="success">Task created successfully.</p>}

        {error && <p className="error">{error.message}</p>}
      </div>
    </section>
  );
}
