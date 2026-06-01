import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { sepolia } from "wagmi/chains";

const projectId = import.meta.env.VITE_TASK_REGISTRY_ADDRESS;
const sepoliaRpcUrl = import.meta.env.VITE_SEPOLIA_RPC_URL;

if (!projectId) {
  throw new Error("Missing VITE_WALLETCONNECT_PROJECT_ID in .env.local");
}

if (!sepoliaRpcUrl) {
  throw new Error("Missing VITE_SEPOLIA_RPC_URL in .env.local");
}

export const wagmiConfig = getDefaultConfig({
  appName: "TaskRegistry dApp",
  projectId,
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(sepoliaRpcUrl),
  },
});
