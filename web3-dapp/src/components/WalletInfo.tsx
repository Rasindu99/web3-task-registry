import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect } from "react";
import { useAccount, useChainId } from "wagmi";

type WalletInfoProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function WalletInfo({ isOpen, onClose }: WalletInfoProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="card wallet-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-dialog-title"
      >
        <div className="card-header">
          <div>
            <p className="eyebrow dialog-eyebrow">Wallet Access</p>
            <h2 id="wallet-dialog-title">Wallet</h2>
            <p className="section-intro">
              Connect once and manage your personal on-chain task registry.
            </p>
          </div>

          <button
            type="button"
            className="dialog-close"
            onClick={onClose}
            aria-label="Close wallet dialog"
          >
            Close
          </button>
        </div>

        <div className="wallet-dialog-actions">
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
    </div>
  );
}
