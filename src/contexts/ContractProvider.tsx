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
        ethereum?: Record<string, unknown> | undefined;
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

    useEffect(() => {
        const initializeContract = async () => {
            try {
                if (!isConnected || !address) return;
                let detectedProvider = null;
                if (window.ethereum) {
                    detectedProvider = new ethers.providers.Web3Provider(window.ethereum);
                    await detectedProvider.send("eth_requestAccounts", []);
                } else {
                    const walletConnectProvider = await EthereumProvider.init({
                        projectId: constant.projectId,
                        chains: [constant.chainId as number],
                        showQrModal: true,
                    });
                    detectedProvider = new ethers.providers.Web3Provider(walletConnectProvider);
                }
                const accounts = await detectedProvider.listAccounts();
                if (!accounts.length) {
                    alert("No accounts found. Please connect a wallet.");
                    return;
                }
                const network = await detectedProvider.getNetwork();
                if (network.chainId !== constant.chainId) {
                    alert("Wrong network detected. Please switch to the correct network.");
                    return;
                }
                const signer = detectedProvider.getSigner();
                const contractInstance = new ethers.Contract(MYIDPresaleAddress, MYIDPresaleABI, signer);
                setProvider(detectedProvider);
                setContract(contractInstance);
                console.log("Contract initialized:", contractInstance);
            } catch (error : any) {
                console.error("Error initializing contract:", error);
                alert(error?.message || "Error initializing contract. Check the console for details.");
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
