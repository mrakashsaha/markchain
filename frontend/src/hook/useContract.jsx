import { ethers } from "ethers";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../smartContract/config";


export const getContract = async () => {
  if (!window.ethereum) throw new Error("MetaMask not installed");

  // Create a provider from MetaMask
  const provider = new ethers.BrowserProvider(window.ethereum);

  // Get the signer (connected wallet)
  const signer = await provider.getSigner();

  // Create a contract instance
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

  return contract;
};
