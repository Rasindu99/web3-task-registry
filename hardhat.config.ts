import "dotenv/config";

import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import hardhatVerify from "@nomicfoundation/hardhat-verify";
import { defineConfig } from "hardhat/config";

const sepoliaRpcUrl = process.env.SEPOLIA_RPC_URL;
const sepoliaPrivateKey = process.env.SEPOLIA_PRIVATE_KEY;
const etherscanApiKey = process.env.ETHERSCAN_API_KEY;

if (!sepoliaRpcUrl) {
  throw new Error("Missing SEPOLIA_RPC_URL in .env");
}

if (!sepoliaPrivateKey) {
  throw new Error("Missing SEPOLIA_PRIVATE_KEY in .env");
}

if (!etherscanApiKey) {
  throw new Error("Missing ETHERSCAN_API_KEY in .env");
}

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin, hardhatVerify],

  solidity: {
    version: "0.8.28",
  },

  networks: {
    sepolia: {
      type: "http",
      chainType: "l1",
      url: sepoliaRpcUrl,
      accounts: [sepoliaPrivateKey],
    },
  },

  verify: {
    etherscan: {
      apiKey: etherscanApiKey,
    },
  },
});
