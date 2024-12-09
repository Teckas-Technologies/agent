"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import InlineSVG from "react-inlinesvg";
import Toast from "../Toast";
import Popup from "../Popup";

interface Props {
    developerId: string;
    created: boolean;
    setCreated: (e: boolean) => void;
}

export type Agent = {
    agentName: string;
    prompt: string;
    codeSnippet: string;
    contractAddress: string;
    abi: string;
};

const SPABody: React.FC<Props> = ({ developerId, created, setCreated }) => {
    const [agentName, setAgentName] = useState('');
    const [prompt, setPrompt] = useState('');
    const [agents, setAgents] = useState<Agent[]>([]);
    const [snippet, setSnippet] = useState('');
    const [contractAddress, setContractAddress] = useState('');
    const [abi, setAbi] = useState('');

    const [success, setSuccess] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toast, setToast] = useState(false);

    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (toast) {
            setTimeout(() => {
                setToast(false);
                setToastMessage("");
            }, 3000)
        }
        if (copied) {
            setTimeout(() => {
                setCopied(false);
            }, 3000)
        }
    }, [toast, copied])

    // Create a new agent
    const handleCreateAgent = async () => {
        try {
            setLoading(true);
            const response = await axios.post('/api/agents', {
                developerId,
                agentName,
                prompt,
                contractAddress,
                abi,
            });
            console.log("Response:", response)
            if (response.status === 201) {
                setLoading(false);
                setToast(true);
                setSuccess(true);
                setToastMessage("Agent Created Successfully!");
                setCreated(!created);
                setSnippet(response.data.codeSnippet);
                setAgents([...agents, { agentName, prompt, contractAddress, abi,codeSnippet: response.data.codeSnippet }]);
                setAgentName('');
                setPrompt('');
                setContractAddress('');
                setAbi('');
            } else {
                setLoading(false);
                setToast(true);
                setSuccess(false);
                setToastMessage("Agent Creation Failed!");
            }
        } catch (err) {
            setLoading(false);
            console.error('Error creating agent:', err);
        }
    };

    const copyToClipboard = () => {
        const codeElement = document.querySelector(".code-content");
        if (codeElement) {
            navigator.clipboard.writeText(codeElement.textContent || "").then(() => {
                // alert("Copied to clipboard!");
                setCopied(true);
            }).catch(err => {
                console.error("Failed to copy text: ", err);
            });
        }
    };
    const disabled = loading || !agentName || !prompt || !contractAddress || !abi;
    return (
        <div className="spa-body w-full h-auto flex flex-wrap md:grid md:grid-cols-5 gap-5 md:px-[1.2rem] px-3 py-5 md:pt-[6.2rem] pt-[5.8rem]">
            <div className="left-doc-content w-full md:col-span-2 py-5 md:px-5 px-3 bg-white rounded-lg">
                <h1 className="text-xl dark:text-black font-bold mb-4">Steps to create an agent:</h1>
                <h2 className="text-lg dark:text-black font-semibold mb-2">1. Provide the following details:</h2>
                <ul className="list-disc pl-6 mb-2">
                    <li className="dark:text-black">
                        <strong className="dark:text-black">Agent Name:</strong> A descriptive name for your agent (e.g., "Invoice Agent").
                    </li>
                    {/* <li>
                        <strong>Agent Description:</strong> Briefly describe what the agent will do (e.g., "Manages invoices and payments").
                    </li> */}
                    <li className="dark:text-black">
                        <strong className="dark:text-black">Agent Prompt:</strong> Instructions for your agent. For example:
                        <div className="relative bg-gray-100 p-4 mt-2 rounded-md border border-gray-300">
                            <code className="code-content block font-mono whitespace-pre-wrap dark:text-black">
                                You are an assistant to help users to create an invoice and fetch their invoices. If the user wants to create an invoice, use the create-payment-request tool. If the user wants to fetch their invoices, use the fetch-payment-request tool.
                            </code>
                            <div onClick={copyToClipboard} className="copy absolute h-7 w-7 top-2 right-2 border border-zinc-800 flex items-center justify-center rounded-md cursor-pointer">
                                <InlineSVG
                                    src={copied ? "images/clipboard.svg" : "images/copy.svg"}
                                    className="fill-current w-4 h-4 text-grey-100"
                                />
                            </div>
                        </div>
                    </li>
                </ul>
                <p className="text-base dark:text-black">
                    Click <strong>"Submit"</strong> to create your agent.
                </p>
                <h2 className="text-lg dark:text-black text-black font-semibold mt-3 mb-1">2. Integrate the agent into your project:</h2>
                <p className="text-base dark:text-black mb-2">
                    After submitting the form, you'll receive a script to integrate the agent into your platform. Here's an example:
                </p>
                <div className="relative bg-gray-100 p-4 rounded-md border border-gray-300 mb-2">
                    <code className="code-content dark:text-black block font-mono whitespace-pre-wrap">
                        &lt;Script id="chatbot"
                        src="https://script-sepia.vercel.app/ChatBot.js"
                        data-agent-id="&lt;!-- Your Agent Id --&gt;"&gt;&lt;/Script&gt;
                    </code>
                </div>

                <p className="text-base dark:text-black">
                    Replace the <code>data-agent-id</code> with your agent id. <br />
                    {/* Replace the <code>data-account-id</code> with your wallet-connected address. <br />
                    Replace the <code>data-wallet-client</code> with your walletClient variable as a stringified JSON. */}
                </p>

                {/* <h2 className="text-lg font-semibold mt-6 mb-2">3. Verify Integration:</h2>
                <ul className="list-disc pl-6 mb-4">
                    <li>Place the script inside the <code>&lt;head&gt;</code> or <code>&lt;body&gt;</code> tag of your HTML file.</li>
                    <li>Replace the <code>data-account-id</code> with your wallet-connected address.</li>
                    <li>Ensure the page is reloaded to verify the chatbot's functionality.</li>
                </ul>

                <p className="text-base">
                    That's it! Your agent is now integrated and ready to assist your users.
                </p> */}
            </div>
            <div className="right-create-agent-form w-full md:col-span-3 py-5 md:px-5 px-3 bg-white rounded-lg">
                <div className="form-box">
                    <h2 className="text-xl dark:text-black text-left font-bold mb-4 text-black">Create a New Agent</h2>
                    <div className="input-field border p-3 rounded-md border-grey-800">
                        <label htmlFor="name" className="text-zinc-700 dark:text-black">Agent Name</label>
                        <input
                            type="text"
                            name="name"
                            value={agentName}
                            onChange={(e) => setAgentName(e.target.value)}
                            placeholder="Enter a name of your agent..."
                            className="w-full px-3 py-2 mb-4 border rounded-md mt-2 text-black border-grey-800 outline-none"
                        />
                    </div>
                    <br />
                    <div className="input-field border p-3 rounded-md border-grey-800">
                        <label htmlFor="instructions" className="text-zinc-700 dark:text-black">Instructions</label>
                        <textarea
                            name="instructions"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Enter a customized prompt for your agent..."
                            className="w-full px-3 py-2 mt-2 h-[10rem] mb-4 border border-grey-800 outline-none rounded-md text-black"
                        />
                    </div>
                    <br />
                    <div className="input-field border p-3 mb-3 rounded-md border-grey-800">
                        <label htmlFor="contractAddress" className="text-zinc-700 dark:text-black">Contract Address</label>
                        <input
                            type="text"
                            name="contractAddress"
                            value={contractAddress}
                            onChange={(e) => setContractAddress(e.target.value)}
                            placeholder="Enter the contract address..."
                            className="w-full px-3 py-2 mb-4 border rounded-md mt-2 text-black border-grey-800 outline-none"
                        />
                    </div>
                    <div className="input-field border p-3 mb-3 rounded-md border-grey-800">
                        <label htmlFor="abi" className="text-zinc-700 dark:text-black">Abi</label>
                        <input
                            type="text"
                            name="abi"
                            value={abi}
                            onChange={(e) => setAbi(e.target.value)}
                            placeholder="Enter the abi address..."
                            className="w-full px-3 py-2 mb-4 border rounded-md mt-2 text-black border-grey-800 outline-none"
                        />
                    </div>
                    <div className="create-btn-section flex items-center gap-5">
                        <button
                            disabled={disabled}
                            onClick={handleCreateAgent}
                            className={`w-auto bg-black backdrop-blur supports-[backdrop-filter]:bg-mb-black/60 text-white py-2 px-5 rounded-md hover:bg-[#1fbf96] ${disabled && "cursor-not-allowed"}`}
                        >
                            <h2 className="font-semibold ">Submit</h2>
                        </button>
                        {loading && <div className="loading flex items-center gap-2">
                            <div role="status">
                                <svg aria-hidden="true" className="inline w-6 h-6 text-gray-200 animate-spin dark:text-gray-600 fill-gray-600 dark:fill-gray-300" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                                </svg>
                                <span className="sr-only">Loading...</span>
                            </div>
                            <h2 className="dark:text-black">Creating your agent...</h2>
                        </div>}
                    </div>
                </div>
            </div>
            {toast && <Toast
                success={success}
                message={toastMessage}
                onClose={() => setToast(false)}
            />}
            {snippet && <Popup codeSnippet={snippet} onClose={() => setSnippet("")} />}
        </div>
    )

}

export default SPABody;