"use client";

import Header from "@/components/Header/Header";
import PlayGround from "@/components/PlayGround/PlayGround";
import { Agent } from "@/components/SPABody/SPABody";
import { useDeveloper } from "@/contexts/DeveloperContext";
import axios from "axios";
import Script from "next/script";
import { Suspense, useEffect, useState } from "react";
import { useAccount } from "wagmi";


const PlayGroundPage = () => {
    const [agents, setAgents] = useState<Agent[]>([]);
    const { developerId, setDeveloperId } = useDeveloper();
    console.log("Dev Id:", developerId)
    const { address } = useAccount();
    const fetchAgents = async (id: string) => {
        try {
            const response = await axios.get('/api/agents', { params: { devId: id } });
            setAgents(response.data);
        } catch (err) {
            console.error('Error fetching agents:', err);
        }
    };

    useEffect(() => {
        const savedDeveloperId = localStorage.getItem('developerId');
        if (savedDeveloperId) {
            setDeveloperId(savedDeveloperId);
        }
    }, []);

    useEffect(() => {
        if (developerId) {
            fetchAgents(developerId);
        }
    }, [developerId]);

    return (
        <>
            <Header created={true} />
            {/* <Script id="chatbot" data-agent-id="67500d5fd8f7b664f8bc39e8" data-account-id={address} src="https://script-sepia.vercel.app/ChatBot.js"></Script> */}
            {/* <Suspense fallback={<div>Loading...</div>}> */}
            <PlayGround agents={agents} />
            {/* </Suspense> */}
        </>
    )
}

export default PlayGroundPage;