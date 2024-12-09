// ContractProvider.tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { ethers, providers } from "ethers";
import { MYIDPresaleABI } from "@/config/ABI";
import { useAccount } from "wagmi";
import { constant } from "@/config/constants";
import { EthereumProvider } from "@walletconnect/ethereum-provider";

declare global {
    interface Window {
        ethereum?:  Record<string, unknown> | undefined;
    }
}

const MYIDPresaleAddress = constant.presaleAddress;

// Create the context
const ContractContext = createContext<{
    provider: ethers.providers.Web3Provider | null;
    contract: ethers.Contract | null;
    myidBalance: string;
    refetchBalance: (account: string) => Promise<void>;
} | undefined>(undefined);

// ContractProvider component
export const ContractProvider = ({ children }: { children: ReactNode }) => {
    const [contract, setContract] = useState<ethers.Contract | null>(null);
    const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
    const [myidBalance, setMyidBalance] = useState("0");
    const { isConnected, address } = useAccount();

    // Function to fetch and set balances
    const getBalances = async (account: string) => {
        if (!contract) return;
        try {
            const [, , tokenBalance] = await contract.balancesOf(account);
            const balance = ethers.utils.formatUnits(tokenBalance, 18);
            setMyidBalance(Number(balance).toFixed(2));
        } catch (error) {
            console.error("Error fetching balances:", error);
        }
    };

    // Refetch balance function
    const refetchBalance = async (account: string) => {
        // if (account) {
        //     await   (account);
        // }
    };

    useEffect(() => {
        if (isConnected && address) {
            getBalances(address);
        }
    }, [isConnected, address, contract]);

    // useEffect(() => {
    //     if (isConnected && ethers && address && typeof window !== "undefined" && window.ethereum) {
    //         const provider = new ethers.providers.Web3Provider(window.ethereum);
    //         const signer = provider.getSigner();
    //         const contractInstance = new ethers.Contract(MYIDPresaleAddress, MYIDPresaleABI, signer);
    //         setProvider(provider);
    //         setContract(contractInstance);
    //     }
    // }, [isConnected, address]);

    useEffect(() => {
        const initializeContract = async () => {
            if (isConnected && address) {
                if (window.ethereum && typeof window !== "undefined") {
                    try {
                        const provider = new ethers.providers.Web3Provider(window.ethereum);
                        const signer = provider.getSigner();
                        const contractInstance = new ethers.Contract(MYIDPresaleAddress, MYIDPresaleABI, signer);
                        setProvider(provider);
                        setContract(contractInstance);
                    } catch (error) {
                        console.log("Error initializing contract with MetaMask", error);
                    }
                } else {
                    // Fallback to WalletConnect when MetaMask is not detected
                    try {
                        const walletConnectProvider = await EthereumProvider.init({
                            projectId: constant.projectId,
                            chains: [constant.chainId as number], // Mainnet
                            showQrModal: true,
                        });

                        const provider = new ethers.providers.Web3Provider(walletConnectProvider);
                        const signer = provider.getSigner();
                        const contractInstance = new ethers.Contract(MYIDPresaleAddress, MYIDPresaleABI, signer);
                        setProvider(provider);
                        setContract(contractInstance);
                    } catch (error) {
                        console.log("Error initializing WalletConnect", error);
                        alert("No Ethereum provider available. Please install MetaMask.");
                    }
                }
            }
        };

        initializeContract();
    }, [isConnected, address]);

    return (
        <ContractContext.Provider value={{ provider, contract, myidBalance, refetchBalance }}>
            {children}
        </ContractContext.Provider>
    );
};

// Custom hook to use the contract
export const useContract = () => {
    const context = useContext(ContractContext);
    if (context === undefined) {
        throw new Error("useContract must be used within a ContractProvider");
    }
    return context;
};
