"use client";

import { useSearchParams } from "next/navigation";
import { Agent } from "../SPABody/SPABody";
import { useEffect, useRef, useState } from "react";

interface Props {
    agents: Agent[];
    onAgentClick: (agent: Agent) => void; // New prop to handle clicks
}

const ScrollAgents: React.FC<Props> = ({ agents, onAgentClick }) => {
    const searchParams = useSearchParams();
    const agentId = searchParams?.get("agentId");

    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

    // const agentRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        if (agentId) {
            // Find the agent with the matching data-agent-id
            const matchedAgent = agents.find((agent) => {
                const match = agent.codeSnippet.match(/data-agent-id="([^"]+)"/);
                return match && match[1] === agentId;
            });
            if (matchedAgent) {
                onAgentClick(matchedAgent);
                setSelectedAgent(matchedAgent); // Set the matched agent as selected
            }
        }
    }, [agentId, agents, onAgentClick]);

    const handleAgentClick = (agent: Agent) => {
        onAgentClick(agent);
        setSelectedAgent(agent); // Set the clicked agent as selected
    };

    return (
        <div className="agent-list w-full bg-white md:px-[1.2rem] py-5 px-3 bg-white rounded-lg" style={{ height: "calc(100vh - 8rem)" }}>
            <h1 className="text-xl font-bold mb-3 text-black">My Agents</h1>
            <div className="agents-scroll-list w-full flex flex-col gap-2 overflow-y-scroll border border-grey-800 rounded-lg p-2" style={{ height: "calc(100vh - 13.5rem)" }}>
                {agents.map((agent, index) => {
                    const match1 = agent.codeSnippet.match(/data-agent-id="([^"]+)"/);
                    const match2 = selectedAgent?.codeSnippet.match(/data-agent-id="([^"]+)"/);
                    const isSelected = match1 && match2 && match1[1] === match2[1];
                    return (
                        <div
                            key={index}
                            onClick={() => handleAgentClick(agent)}
                            className={`agent border py-2 rounded-lg cursor-pointer ${isSelected ? "border-black" : "border-grey-800"}`}
                        >
                            <div className="top px-2 pb-1 flex items-center gap-2">
                                <div className="rn-logo w-[2rem] h-[2rem] bg-gray-200 rounded-full">
                                    <img src="images/agentify-logo.jpg" alt="logo" className="w-full h-full object-cover rounded-full" />
                                </div>
                                <h2 className="text-md text-black dark:text-black truncate-1-lines">{agent.agentName}</h2>
                            </div>
                            <p className="px-3 text-sm text-zinc-500 dark:text-black truncate-2-lines">{agent.prompt}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ScrollAgents;