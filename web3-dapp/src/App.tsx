import { useCallback, useState } from "react";
import { CreateTaskForm } from "./components/CreateTaskForm";
import { TaskList } from "./components/TaskList";
import { WalletInfo } from "./components/WalletInfo";

function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshTasks = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  return (
    <main className="page">
      <section className="hero">
        <h1>TaskRegistry dApp</h1>
        <p>
          Connect your wallet, create on-chain tasks, and complete them through
          your Sepolia smart contract.
        </p>
      </section>

      <div className="app-layout">
        <div className="control-column">
          <WalletInfo />

          <CreateTaskForm onTaskCreated={refreshTasks} />
        </div>

        <TaskList refreshKey={refreshKey} />
      </div>
    </main>
  );
}

export default App;
