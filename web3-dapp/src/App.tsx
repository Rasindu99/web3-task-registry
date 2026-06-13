import { useCallback, useState } from "react";
import { useAccount } from "wagmi";
import { CreateTaskForm } from "./components/CreateTaskForm";
import { TaskList } from "./components/TaskList";
import { WalletInfo } from "./components/WalletInfo";

function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isWalletDialogOpen, setIsWalletDialogOpen] = useState(false);
  const { isConnected } = useAccount();

  const refreshTasks = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  const walletButtonLabel = isConnected ? "Wallet Connected" : "Connect Wallet";
  const walletButtonClassName = isConnected
    ? "wallet-trigger wallet-trigger-connected"
    : "wallet-trigger wallet-trigger-disconnected";

  return (
    <main className="page">
      <section className="hero">
        <div className="hero-copy">
          <h1>TaskRegistry dApp</h1>
          <p>
            Connect your wallet, create on-chain tasks, and complete them
            through your Sepolia smart contract.
          </p>

          <div className="hero-meta">
            <span className="hero-pill">Network: Sepolia</span>
            <span className="hero-pill">Smart Contract Tasks</span>
            <button
              type="button"
              className={walletButtonClassName}
              onClick={() => setIsWalletDialogOpen(true)}
            >
              {walletButtonLabel}
            </button>
          </div>
        </div>
      </section>

      <section className="app-layout">
        <CreateTaskForm onTaskCreated={refreshTasks} />
        <TaskList refreshKey={refreshKey} />
      </section>

      <WalletInfo
        isOpen={isWalletDialogOpen}
        onClose={() => setIsWalletDialogOpen(false)}
      />
    </main>
  );
}

export default App;
