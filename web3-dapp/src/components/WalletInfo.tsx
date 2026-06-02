import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId } from "wagmi";

export function WalletInfo() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  return (
    <section className="card">
      <div className="card-header">
        <h2>Wallet</h2>
        <ConnectButton />
      </div>

      {isConnected ? (
        <div className="info-grid">
          <p>
            <strong>Status:</strong> Connected
          </p>
          <p className="address-line">
            <strong>Address:</strong> {address}
          </p>
          <p>
            <strong>Chain ID:</strong> {chainId}
          </p>
        </div>
      ) : (
        <p>Connect your wallet to use the dApp.</p>
      )}
    </section>
  );
}
