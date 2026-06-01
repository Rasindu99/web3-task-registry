import { isAddress, type Address } from "viem";

const taskRegistryAddress = import.meta.env.VITE_TASK_REGISTRY_ADDRESS as
  | Address
  | undefined;

if (!taskRegistryAddress || !isAddress(taskRegistryAddress)) {
  throw new Error(
    "Invalid or missing VITE_TASK_REGISTRY_ADDRESS in .env.local",
  );
}

export const contracts = {
  taskRegistry: taskRegistryAddress as Address,
};
