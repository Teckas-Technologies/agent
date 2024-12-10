"use client";

import React, { useEffect, useRef, useState } from "react";
import InlineSVG from "react-inlinesvg";
import "./PlayGround.css"
import { Agent } from "../SPABody/SPABody";
import axios from "axios";
import { useAccount } from "wagmi";
import { useCreateRequest } from "@/hooks/useCreateRequests";
import { currencies } from "@/config/currencies";
import { useFetchRequests } from "@/hooks/useFetchRequests";
import { approveErc20, hasErc20Approval, hasSufficientFunds } from "@requestnetwork/payment-processor";
import { useEthersV5Provider } from "@/hooks/use-ethers-v5-provider";
import { getPaymentNetworkExtension } from "@requestnetwork/payment-detection";
import { Types } from "@requestnetwork/request-client.js";
import { useEthersV5Signer } from "@/hooks/use-ethers-v5-signer";
import { usePayRequest } from "@/hooks/usePayRequests";
import Toast from "../Toast";
import { parseUnits } from "viem";
import Copied from "../Copied";
import { useGeneric } from "@/hooks/useGeneric";

interface Props {
    agent: Agent | null;
}

interface Message {
    sender: "user" | "assistant";
    message: string;
}

const ChatBox: React.FC<Props> = ({ agent }) => {
    const [copied, setCopied] = useState(false);
    const [agentId, setAgentId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([
        { sender: "assistant", message: "Hello, how can I assist you?" },
    ]);
    const [inputValue, setInputValue] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const { address, isConnected } = useAccount();
    const provider = useEthersV5Provider();
    const signer = useEthersV5Signer();
    const { createRequest } = useCreateRequest();
    const { fetchRequests, fetchSingleRequest } = useFetchRequests();
    const { payTheRequest } = usePayRequest();

    const [success, setSuccess] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toast, setToast] = useState(false);

    const [sessionId, setSessionId] = useState<string | null>(null);

    const [activePayingId, setActivePayingId] = useState("");
    const [paid, setPaid] = useState(false);

    const { funcCall, getfuncTokenValue } = useGeneric();

    useEffect(() => {
        if (activePayingId && paid) {
            setMessages((prevMessages) =>
                prevMessages.map((msg) => {
                    if (msg.message.includes(`<span hidden>${activePayingId}</span>`)) {
                        // Update the status to Paid
                        const updatedMessage = msg.message.replace(
                            `<b>Status:</b> Unpaid`,
                            `<b>Status:</b> Paid`
                        );

                        return { ...msg, message: updatedMessage };
                    }
                    return msg;
                })
            );
        }
    }, [paid]);

    // Function to generate a unique session ID
    const generateSessionId = (agentId: string) => {
        return `${agentId}-${Math.random().toString(36).substring(2, 15)}`;
    };

    // Hook to initialize session ID when the chat is opened
    useEffect(() => {
        const session = generateSessionId(agentId || ""); // Generate a new session ID
        setSessionId(session);
    }, [agentId]);

    useEffect(() => {
        if (toast) {
            setTimeout(() => {
                setToast(false);
                setToastMessage("");
            }, 3000)
        }
    }, [toast])

    useEffect(() => {
        if (paid) {
            setTimeout(() => {
                setPaid(false);
            }, 3000)
        }
    }, [paid])

    useEffect(() => {
        if (copied) {
            setTimeout(() => {
                setCopied(false);
            }, 3000)
        }
    }, [copied])

    const copyToClipboard = (snippet: string) => {
        navigator.clipboard.writeText(snippet || "").then(() => {
            // alert("Copied to clipboard!");
            setCopied(true);
        }).catch(err => {
            console.error("Failed to copy text: ", err);
        });
    };

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    useEffect(() => {
        if (!paid) {
            scrollToBottom();
        }
    }, [messages]);

    useEffect(() => {
        if (agent?.codeSnippet) {
            // Extract data-agent-id using a regular expression
            const match = agent.codeSnippet.match(/data-agent-id="([^"]+)"/);
            if (match) {
                setAgentId(match[1]); // Store the extracted value
            } else {
                setAgentId(null); // Reset if no data-agent-id is found
            }
        } else {
            setAgentId(null); // Reset if no agent or codeSnippet
        }
    }, [agent]);

    const truncateAddress = (address: string) => {
        if (!address) return "";
        if (address.length <= 8) return address; // If too short, no truncation needed
        return `${address.slice(0, 12)}...${address.slice(-3)}`;
    };

    const convertToWholeNumber = (amount: string, decimals: number): number => {
        // Convert the string to a number and divide by 10^decimals to shift decimal points
        return parseInt(amount) / Math.pow(10, decimals);
    };

    const handleSend = async () => {
        if (!inputValue.trim()) return;
        if (isLoading) {
            // alert(isLoading)
            return;
        }

        const userMessage: Message = { sender: "user", message: inputValue };
        setMessages((prev) => [...prev, userMessage]); // Add user's message to messages
        setInputValue(""); // Clear the input field
        setIsLoading(true); // Indicate API is processing

        console.log("SessionId:", sessionId)

        try {
            const requestBody = {
                id: sessionId || 100000,
                prompt: JSON.stringify({ query: inputValue, isWalletConnected: isConnected && address ? "true" : "false" }),
                agentId,
            };

            // const isAgentExist = await axios.get(`https://abi-master-agent-dgcmghddard0h8d2.canadacentral-01.azurewebsites.net/check-agent?agentId=${agentId}`);

            // if (!isAgentExist.data.agent_exists) {
            //     setMessages((prev) => [...prev, { sender: "assistant", message: "Wait for 2 seconds! I'm preparing." }]);
            //     return;
            // }

            // Mock API call, replace with actual API logic
            const response = await axios.post("https://abi-master-agent-dgcmghddard0h8d2.canadacentral-01.azurewebsites.net/voice-backend",
                requestBody,
                {
                    headers: { "Content-Type": "application/json" },
                }
            );

            console.log("RESPONSE:", response)

            const assistantMessage: Message = {
                sender: "assistant",
                message: response.data.data.text, // Assuming API returns { reply: string }
            };

            if (response.data.data.intent === "final_json") {
                if (!address || !isConnected) {
                    setMessages((prev) => [...prev, { sender: "assistant", message: "Please connect your wallet!" }]);
                    return;
                }
                const contractAddress = response.data.data.meta_data.contract;
                const functionName = response.data.data.meta_data.functionName;
                const gasLimit = response.data.data.meta_data.gasLimit;
                const parameters = response.data.data.meta_data.parameters;

                if (!address || (address.trim().startsWith("0x") && address.trim().length !== 42)) {
                    setMessages((prev) => [...prev, { sender: "assistant", message: "Not a valid connected address!" }]);
                    return;
                }

                setMessages((prev) => [...prev, { sender: "assistant", message: `Executing function: ${functionName}...` }]);
                setIsCreating(true);

                const res = await getfuncTokenValue(functionName, parameters, gasLimit);

                console.log("RES:", res);

                if (res?.success) {
                    if (res?.isGas) {
                        const txData = res.data as unknown as { transactionHash: string };
                        setMessages((prev) => [...prev, { sender: "assistant", message: `Function call executed successfully! <br /> <a target="_blank" href='https://sepolia.etherscan.io/tx/${txData.transactionHash}'></a>` }]);
                        console.log("RES1:", res.data)
                        setIsCreating(false);
                    }

                    if (!res?.isGas) {
                        setMessages((prev) => [...prev, { sender: "assistant", message: String(res?.data) }]);
                        console.log("RES2:", res?.data);
                        setIsCreating(false);
                    }
                } else {
                    setMessages((prev) => [...prev, { sender: "assistant", message: "Function call execution failed!" }]);
                }

            } else if (response.data.data.intent === "get_approve") {
                if (!address || !isConnected) {
                    setMessages((prev) => [...prev, { sender: "assistant", message: "Please connect your wallet!" }]);
                    return;
                }
                setMessages((prev) => [...prev, { sender: "assistant", message: String("Executing Approval...") }]);
                setIsCreating(true);
                const res = await funcCall("100");
                setMessages((prev) => [...prev, { sender: "assistant", message: `Approval Executed Successfully!` }]);
                setIsCreating(true);

            } else {
                setMessages((prev) => [...prev, assistantMessage]);
            }
        } catch (error) {
            console.error("Error fetching chat response:", error);
            setMessages((prev) => [
                ...prev,
                { sender: "assistant", message: "Sorry, something went wrong." },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const getHiddenSpanText = (message: string) => {
        const regex = /<span hidden>(.*?)<\/span>/; // Regex to match the text inside <span hidden>
        const match = message.match(regex);
        return match ? match[1] : ''; // Return the extracted text or empty string if not found
    }

    return (
        <div className="chat-box w-full h-full bg-white h-auto md:px-[1.2rem] py-5 px-3 bg-white rounded-lg" style={{ height: "calc(100vh - 8rem)" }}>
            <div className="chat w-full h-full flex flex-col gap-0" style={{ height: "calc(100vh - 11rem)" }}>
                <div className="top-chat w-full flex justify-between items-center h-[3rem] py-2">
                    <div className="agent-info flex items-center gap-2">
                        <div className="rn-logo w-[2rem] h-[2rem] p-2 bg-gray-200 rounded-full">
                            <img src="images/logo-sm.svg" alt="logo" className="w-full h-full object-cover" />
                        </div>
                        <h2 className="dark:text-black">{agent?.agentName}</h2>
                    </div>
                    <div className="share border border-zinc-900 rounded-md p-1 cursor-pointer" onClick={() => copyToClipboard(agent?.codeSnippet || "")}>
                        <InlineSVG
                            src="images/3-dots.svg"
                            className="fill-current w-5 h-5 text-zinc-900"
                        />
                    </div>
                </div>
                <div className="messages w-full pt-2 flex-grow overflow-y-scroll overflow-x-hidden">
                    {messages.map((msg, index) => (
                        <>
                            <div key={index} className={`whole-div w-full flex items-center gap-1 ${msg.sender === "user" ? "justify-end" : "justify-start"} px-3`}>
                                <div className={`relative message ${msg.sender} p-2 mb-2 flex items-center gap-1 rounded-lg max-w-xs ${msg.sender === "user" ? "bg-zinc-300" : "bg-black"}`}>
                                    {isCreating && index === messages.length - 1 && msg.sender === "assistant" && (
                                        <div className="loading flex items-center">
                                            <div role="status">
                                                <svg aria-hidden="true" className="inline w-4 h-4 text-gray-200 animate-spin dark:text-gray-600 fill-gray-600 dark:fill-gray-300" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                                                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                                                </svg>
                                                <span className="sr-only">Loading...</span>
                                            </div>
                                        </div>
                                    )}
                                    <p className={`text-sm ${msg.sender === "assistant" ? "text-white" : "text-black"}`} dangerouslySetInnerHTML={{ __html: msg.message }}></p>
                                    {msg.sender === "assistant" ? <div className="absolute top-[-4px] left-[-7px]">
                                        <InlineSVG
                                            src="images/send.svg"
                                            style={{ transform: 'rotate(245deg)' }}
                                            className="fill-current w-5 h-5 text-black"
                                        />
                                    </div> : <div className="absolute top-[-4px] right-[-7px]">
                                        <InlineSVG
                                            src="images/send.svg"
                                            style={{ transform: 'rotate(23deg)' }}
                                            className="fill-current w-5 h-5 text-zinc-300"
                                        />
                                    </div>}
                                </div>
                            </div>
                            {isLoading && index === messages.length - 1 && !isCreating && <div className={`whole-div w-full flex items-center gap-1 justify-start px-3`}>
                                <div className={`relative message p-2 mb-2 flex items-center gap-1 rounded-lg max-w-xs bg-black`}>
                                    <p className={`text-sm text-white`}>Typing...</p>
                                    <div className="absolute top-[-4px] left-[-7px]">
                                        <InlineSVG
                                            src="images/send.svg"
                                            style={{ transform: 'rotate(245deg)' }}
                                            className="fill-current w-5 h-5 text-black"
                                        />
                                    </div>
                                </div>
                            </div>}
                        </>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <div className="enter-div w-full flex items-center gap-2 h-[3rem]">
                    <div className="enter-box w-full flex flex-grow items-center gap-2 border border-grey-900 px-3 py-2 rounded-lg">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Enter your message here..."
                            className="flex-grow h-8 text-md font-medium dark:text-black border-none outline-none"
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        />
                        <div className={`send-btn ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`} onClick={handleSend}>
                            <InlineSVG
                                src="images/send.svg"
                                className="fill-current w-6 h-6 text-black"
                            />
                        </div>
                    </div>
                    <div className="voice-btn border border-grey-900 px-2 py-2 rounded-lg">
                        <div className="send-btn border border-black p-1.5 rounded-full cursor-not-allowed">
                            <InlineSVG
                                src="images/mic.svg"
                                className="fill-current w-5 h-5 text-black"
                            />
                        </div>
                    </div>
                </div>
            </div>
            {toast && <Toast
                success={success}
                message={toastMessage}
                onClose={() => setToast(false)}
            />}
            {copied && <Copied />}
        </div>
    )
}

export default ChatBox;