"use client";

import { useEffect, useState } from "react";
import { Agent } from "../SPABody/SPABody";
import Copied from "../Copied";
import { useRouter } from "next/navigation";

interface Props {
    agents: Agent[];
}

const AgentList: React.FC<Props> = ({ agents }) => {
    const [isMobile, setIsMobile] = useState(false);
    const [copied, setCopied] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (copied) {
            setTimeout(() => {
                setCopied(false);
            }, 3000)
        }
    }, [copied])

    const mobileBreakPoint = 768;
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth <= mobileBreakPoint);
        };
        checkScreenSize();
        window.addEventListener("resize", checkScreenSize);
        return () => window.removeEventListener("resize", checkScreenSize);
    }, [mobileBreakPoint]);

    const copyToClipboard = (snippet: string) => {
        navigator.clipboard.writeText(snippet || "").then(() => {
            // alert("Copied to clipboard!");
            setCopied(true);
        }).catch(err => {
            console.error("Failed to copy text: ", err);
        });
    };

    return (
        <div className="agent-list w-full bg-white h-auto md:px-[1.2rem] py-5 px-3 bg-white rounded-lg">
            <h1 className="text-xl font-bold mb-6 text-black">My Agents</h1>
            <table className="w-full table-auto bg-white shadow-md rounded-bl-xl rounded-br-xl text-black">
                <thead className="bg-black backdrop-blur supports-[backdrop-filter]:bg-mb-black/60">
                    <tr>
                        <th className="px-4 py-2 text-white text-md font-semibold rounded-tl-xl md:min-w-[10rem] min-w-[7rem]">Agent Name</th>
                        <th className={`px-4 py-2 text-white text-md font-semibold ${isMobile && "hidden"}`}>Prompt</th>
                        <th className={`px-4 py-2 text-white text-md font-semibold ${isMobile && "hidden"}`}>Code Snippet</th>
                        <th className={`px-4 py-2 text-white text-md font-semibold rounded-tr-xl min-w-[7.5rem]`}>Playground</th>
                    </tr>
                </thead>
                <tbody>
                    {agents.length === 0 && <tr>
                        <td colSpan={4} className="text-black text-center px-4 py-4">No agents found!</td>
                    </tr>}
                    {agents.map((agent, index) => (
                        <tr className="border-t">
                            <td className="px-4 py-2 text-black md:min-w-[10rem] min-w-[7rem]">{agent.agentName}</td>
                            <td className={`px-4 py-2 text-black ${isMobile && "hidden"}`}>{agent.prompt}</td>
                            <td className={`px-4 py-2 text-black ${isMobile && "hidden"}`}>
                                <div className="bg-gray-100 p-2 rounded-md border border-gray-300 cursor-pointer" onClick={() => copyToClipboard(agent.codeSnippet)}>
                                    <code className="snippet-content block font-mono whitespace-pre-wrap">
                                        {agent.codeSnippet}
                                    </code>
                                </div>
                            </td>
                            <td className="px-4 py-2 text-center min-w-[7.5rem]">
                                <button className="bg-black backdrop-blur supports-[backdrop-filter]:bg-mb-black/60 text-white px-3 py-1 rounded-md" onClick={() => {
                                    // Extract the data-agent-id value
                                    const match = agent.codeSnippet.match(/data-agent-id="([^"]+)"/);
                                    const dataId = match ? match[1] : null;

                                    if (dataId) {
                                        router.push(`/playground?agentId=${dataId}`);
                                    } else {
                                        console.error("Data ID not found in codeSnippet.");
                                    }
                                }}>
                                    Try it out
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {copied && <Copied />}
        </div>
    )

}

export default AgentList;