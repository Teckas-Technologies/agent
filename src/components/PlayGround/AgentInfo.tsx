"use client";

import { useEffect, useState } from "react";
import { Agent } from "../SPABody/SPABody";
import Copied from "../Copied";

interface Props {
    agent: Agent | null;
}

const AgentInfo: React.FC<Props> = ({ agent }) => {
    const [copied, setCopied] = useState(false);

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

    return (
        <div className="agent-info w-full h-full bg-white h-auto md:px-[1.2rem] py-5 px-3 bg-white rounded-lg" style={{ height: "calc(100vh - 8rem)" }}>
            <h1 className="text-xl font-bold mb-3 text-black dark:text-black">Agent Details</h1>
            <div className="agent-name border border-grey-800 rounded-lg py-2 px-3">
                <h2 className="text-md text-black dark:text-black font-semibold">Agent Name:</h2>
                <p className="text-black">{agent?.agentName}</p>
            </div>
            <div className="agent-instruction border border-grey-800 rounded-lg py-2 px-3 mt-2">
                <h2 className="text-md text-black dark:text-black font-semibold">Instructions:</h2>
                <div className="agent-instructions h-[8.7rem] overflow-y-scroll overflow-x-hidden">
                    <p className="text-justify text-black px-1">{agent?.prompt}</p>
                </div>
            </div>
            <div className="agent-name border border-grey-800 rounded-lg py-2 px-3 mt-2">
                <h2 className="text-md dark:text-black text-black font-semibold">Code Snippet:</h2>
                <div className="bg-gray-100 p-2 rounded-md border border-gray-300 cursor-pointer" onClick={() => copyToClipboard(agent?.codeSnippet || "")}>
                    <code className="snippet-content dark:text-black block font-mono whitespace-pre-wrap">
                        {agent?.codeSnippet}
                    </code>
                </div>
            </div>
            {copied && <Copied />}
        </div>
    )

}

export default AgentInfo;