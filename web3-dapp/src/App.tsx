import { useCallback, useState } from "react";
import { CreateTaskForm } from "./components/CreateTaskForm";
import { TaskList } from "./components/TaskList";
import { WalletInfo } from "./components/WalletInfo";

function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isWalletDialogOpen, setIsWalletDialogOpen] = useState(false);

  const refreshTasks = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

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
            <span className="hero-pill">Wallet Ready</span>
            <button
              type="button"
              className="wallet-trigger"
              onClick={() => setIsWalletDialogOpen(true)}
            >
              Open Wallet
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
