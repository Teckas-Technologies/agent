"use client";

import AgentList from "../AgentList/AgentList";
import React, { useState } from "react";
import { Agent } from "../SPABody/SPABody";
import ScrollAgents from "../AgentList/ScrollAgents";
import ChatBox from "./ChatBox";
import AgentInfo from "./AgentInfo";

interface Props {
    agents: Agent[];
}

const PlayGround: React.FC<Props> = ({agents}) => {
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

    return (
        <div className="relative min-h-screen w-full pb-5 bg-gray-200 pt-[5rem] overflow-x-hidden">
            <div className="play-ground-columns mt-5 h-auto flex flex-wrap md:grid md:grid-cols-4 gap-5 md:px-[1.2rem] px-3">
                <div className="left-agents md:flex hidden w-full md:col-span-1">
                    <ScrollAgents agents={agents} onAgentClick={setSelectedAgent} />
                </div>
                <div className="center-chat-box w-full md:col-span-2">
                    <ChatBox agent={selectedAgent} />
                </div>
                <div className="right-agent-spec md:flex hidden w-full md:col-span-1 ">
                    <AgentInfo agent={selectedAgent} />
                </div>
            </div>
        </div>
    )
}

export default PlayGround;