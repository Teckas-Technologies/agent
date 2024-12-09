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

            const isAgentExist = await axios.get(`https://rnp-master-agent-d2b5etd8cwgzcaer.canadacentral-01.azurewebsites.net/check-agent?agentId=${agentId}`);

            if (!isAgentExist.data.agent_exists) {
                setMessages((prev) => [...prev, { sender: "assistant", message: "Wait for 2 seconds! I'm preparing." }]);
                return;
            }

            // Mock API call, replace with actual API logic
            const response = await axios.post("https://rnp-master-agent-d2b5etd8cwgzcaer.canadacentral-01.azurewebsites.net/voice-backend",
                requestBody,
                {
                    headers: { "Content-Type": "application/json" },
                }
            );

            console.log("RESPONSE:", response)

            // const data = await response?.json();
            const assistantMessage: Message = {
                sender: "assistant",
                message: response.data.data.text, // Assuming API returns { reply: string }
            };

            if (response.data.data.intent === "finalJson") {
                if (!address || !isConnected) {
                    setMessages((prev) => [...prev, { sender: "assistant", message: "Please connect your wallet!" }]);
                    return;
                }
                const payerIdentity = response.data.data.meta_data.receiverId;
                const currencySymbol = response.data.data.meta_data.currency.toLowerCase();

                // Find the key-value pair in the currencies map where the symbol matches
                const currencyKey = Array.from(currencies.entries()).find(
                    ([key, curr]) => curr.symbol.toLowerCase() === currencySymbol.toLowerCase() && curr.chainId === 11155111
                )?.[0]; // Extract the key from the entry

                console.log("currencyKey", currencyKey)

                if (!currencyKey) {
                    setMessages((prev) => [...prev, { sender: "assistant", message: "Unsupported currency!" }]);
                    return;
                }
                console.log(payerIdentity, address)
                if (!payerIdentity || (payerIdentity.trim().startsWith("0x") && payerIdentity.trim().length !== 42)) {
                    setMessages((prev) => [...prev, { sender: "assistant", message: "Not a valid receiver address!" }]);
                    return;
                }
                if (!address || (address.trim().startsWith("0x") && address.trim().length !== 42)) {
                    setMessages((prev) => [...prev, { sender: "assistant", message: "Not a valid recipient address!" }]);
                    return;
                }
                const dueDate = new Date();
                const formattedDueDate = new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                }).format(dueDate);

                setMessages((prev) => [...prev, { sender: "assistant", message: "Creating your request!" }]);
                setIsCreating(true);

                console.log("amount", response.data.data.meta_data.amount.trim(),);

                const created = await createRequest({
                    recipientAddress: address.trim() || "",
                    currency: currencyKey.trim(),
                    payerAddress: payerIdentity.trim(),
                    amount: response.data.data.meta_data.amount.trim(),
                    storageChain: "11155111",
                    dueDate: formattedDueDate,
                    reason: response.data.data.meta_data.reason,
                    extra: response.data.data.meta_data.extra
                })

                if (created?.success) {
                    setMessages((prev) => [...prev, {
                        sender: "assistant", message: `
                        ${response.data.data.text}
                        <div hidden>Request Created</div>
                        <span hidden>${created.data.confirmedRequestData?.requestId.trim()}</span>
                        ` }]);
                    setIsCreating(false);
                    return;
                } else {
                    setMessages((prev) => [...prev, { sender: "assistant", message: "You request creation has been failed, Please try again later!" }]);
                    setIsCreating(false);
                    return;
                }
            } else if ((response.data.data.meta_data.isFetchPaymentRequest || response.data.data.intent === "fetchPaymentRequests" || response.data.data.intent === "fetchPaymentRequest") && (!response.data.data.text.includes("assist you") || !response.data.data.text.includes("today"))) {
                // alert("Fetching");
                if (!address || !isConnected) {
                    setMessages((prev) => [...prev, { sender: "assistant", message: "Please connect your wallet!" }]);
                    return;
                }
                const requests = await fetchRequests(address);
                if (requests && requests.length === 0) {
                    setMessages((prev) => [...prev, { sender: "assistant", message: "No payment requests found!" }]);
                    return;
                }

                const formattedMessages: Message[] = requests?.map((req) => {
                    const truncatedPayerAddress = truncateAddress(req.payer?.value || "");
                    const truncatedPayeeAddress = truncateAddress(req.payee?.value || "")
                    const payer = truncatedPayerAddress;
                    const payee = truncatedPayeeAddress;
                    const amount = convertToWholeNumber(req.expectedAmount.toString() || "0", 6);
                    const currency = req.currency;
                    const requestId = req.requestId;
                    const isPaid = req.balance?.balance === req.expectedAmount ? "Paid" : "Unpaid";

                    return {
                        sender: "assistant",
                        message:
                            `<b>Payer:</b> ${payer},
                            <br />
                            <b>Payee:</b> ${payee},
                            <br />
                            <b>Amount:</b> ${amount} ${currency},
                            <br />
                            <b>Status:</b> ${isPaid}
                            <span hidden>${requestId.trim()}</span>`
                    };
                }) || [];
                console.log("Requests:", requests);
                setMessages((prev) => [...prev, ...formattedMessages]);
            } else if (response.data.data.intent === "getReceiverId") {
                const text = response.data.data.text;
                if (!text) {
                    setMessages((prev) => [...prev, { sender: "assistant", message: "Sure, let's start creating your payment request. Please provide the receiver's account starting with '0x'." }]);
                } else if (typeof text === "string" && (text.toLowerCase().includes("following") || text.toLowerCase().includes(":") || !text)) {
                    setMessages((prev) => [...prev, { sender: "assistant", message: "Sure, let's start creating your payment request. Please provide the receiver's account starting with '0x'." }]);
                } else {
                    setMessages((prev) => [...prev, assistantMessage]);
                }
            } else if (!response.data.data.text) {
                if (response.data.data.intent === "getCurrency") {
                    setMessages((prev) => [...prev, { sender: "assistant", message: "Great! Now, please specify the currency you want to use for the payment request." }]);
                } else if (response.data.data.intent === "getAmount") {
                    setMessages((prev) => [...prev, { sender: "assistant", message: "Perfect! Next, please enter the amount for the payment request." }]);
                } else if (response.data.data.intent === "getReason") {
                    setMessages((prev) => [...prev, { sender: "assistant", message: "Got it! Now, please provide the reason for this payment request." }]);
                } else if (response.data.data.intent === "getExtradetails" || response.data.data.intent === "getExtraDetailName1" || response.data.data.intent === "getExtraDetailName2") {
                    setMessages((prev) => [...prev, { sender: "assistant", message: "Do you have any additional details for this payment request?" }]);
                } else {
                    setMessages((prev) => [...prev, { sender: "assistant", message: "I'm going to sleep. Wait for 5 minutes!" }]);
                }

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

    const handleApprove = async (requestData: Types.IRequestData) => {
        setIsApproving(true);
        try {
            const _hasSufficientFunds = await hasSufficientFunds(
                {
                    request: requestData,
                    address: address as string,
                    providerOptions: {
                        provider: provider,
                    }
                }
            );

            if (!_hasSufficientFunds) {
                // alert("Insufficient Balance:" + _hasSufficientFunds);
                setIsApproving(false);
                setSuccess(false);
                setToastMessage("Insufficient Balance!");
                setToast(true);
                return;
            }

            if (getPaymentNetworkExtension(requestData)?.id === Types.Extension.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT) {
                try {
                    const _hasErc20Approval = await hasErc20Approval(
                        requestData,
                        address as string,
                        provider,
                    );
                    if (!_hasErc20Approval) {
                        try {
                            const approvalTx = await approveErc20(requestData, signer);
                            await approvalTx.wait(2);
                        } catch (approvalError) {
                            // setSuccess(false);
                            // setToastMessage("ERC20 Approval Failed!");
                            // setToast(true);
                            console.error("Error during ERC20 approval:", approvalError);
                            return;
                        }
                    }
                } catch (approvalCheckError) {
                    // setSuccess(false);
                    // setToastMessage("Can't find approval!");
                    // setToast(true);
                    console.error("Error checking ERC20 approval:", approvalCheckError);
                    return;
                }
            }
        } catch (error) {
            console.error("Error in handleApprove:", error);
            // setSuccess(false);
            // setToastMessage("Approval Failed!");
            // setToast(true);
        } finally {
            setIsApproving(false);
        }
    };

    const handlePay = async (requestId: string) => {
        setActivePayingId(requestId);
        try {
            const requestData = await fetchSingleRequest(requestId);
            if (!requestData) {
                setSuccess(false);
                setToastMessage("Payment Request ID Not valid!");
                setToast(true);
                return;
            }

            try {
                await handleApprove(requestData);
            } catch (approveError) {
                // console.error("Error in handleApprove:", approveError);
                setIsApproving(false);
                setSuccess(false);
                setToastMessage("Payment approval failed!");
                setToast(true);
                return;
            }

            setIsPaying(true);
            try {
                const res = await payTheRequest({ requestId });
                if (res?.success) {
                    setPaid(true);
                    setIsPaying(false);
                    setSuccess(true);
                    setToastMessage("Payment Successful!");
                    setToast(true);
                } else {
                    throw new Error("Payment failed!");
                }
                console.log("RES:", res);
            } catch (paymentError) {
                console.error("Error in payment:", paymentError);
                setIsPaying(false);
                // setSuccess(false);
                // setToastMessage("Payment failed!");
                // setToast(true);
            }
        } catch (error) {
            console.error("Error in handlePay:", error);
            setSuccess(false);
            setToastMessage("Something went wrong!");
            setToast(true);
        } finally {
            setIsPaying(false); // Ensure this is set even if errors occur
        }
    };

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

                                {msg.message.includes("Request Created") && <>
                                    <a href={`https://scan.request.network/request/${getHiddenSpanText(msg.message)}`} target="_blank" rel="noopener noreferrer">
                                        <div className="approve-btn px-2 py-1 min-w-[5rem] bg-zinc-200 rounded-3xl border-2 border-zinc-200 hover:border-zinc-400 cursor-pointer">
                                            <h2 className="text-center dark:text-black text-sm">View</h2>
                                        </div>
                                    </a>
                                </>}

                                {msg.message.includes("Payer") && <div className="btns flex flex-col gap-1">
                                    {msg.message.includes("<b>Status:</b> Unpaid") && <>
                                        <div className="pay-btn px-2 py-1 min-w-[5rem] flex items-center justify-center gap-1 bg-black rounded-3xl border-2 border-zinc-200 hover:border-zinc-400 cursor-pointer" onClick={() => { handlePay(getHiddenSpanText(msg.message)); setActivePayingId(getHiddenSpanText(msg.message)); }} >
                                            {(isPaying || isApproving) && activePayingId === getHiddenSpanText(msg.message) && <div className="loading flex items-center">
                                                <div role="status">
                                                    <svg aria-hidden="true" className="inline w-3.5 h-3.5 text-white animate-spin dark:text-gray-600 fill-gray-600 dark:fill-gray-300" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                                                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                                                    </svg>
                                                    <span className="sr-only">Loading...</span>
                                                </div>
                                            </div>}
                                            <h2 className="text-center dark:text-black text-sm">{isPaying && activePayingId === getHiddenSpanText(msg.message) ? "Paying.." : isApproving && activePayingId === getHiddenSpanText(msg.message) ? "Approving.." : "Pay"}</h2>
                                        </div>
                                    </>}
                                    {msg.message.includes("<b>Status:</b> Paid") && <>
                                        <a href={`https://scan.request.network/request/${getHiddenSpanText(msg.message)}`} target="_blank" rel="noopener noreferrer">
                                            <div className="approve-btn px-2 py-1 min-w-[5rem] bg-zinc-200 rounded-3xl border-2 border-zinc-200 hover:border-zinc-400 cursor-pointer">
                                                <h2 className="text-center dark:text-black text-sm">View</h2>
                                            </div>
                                        </a>
                                    </>}
                                </div>}
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