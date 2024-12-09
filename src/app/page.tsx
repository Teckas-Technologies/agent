'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '@/components/Header/Header';
import SPABody from '@/components/SPABody/SPABody';
import AgentList from '@/components/AgentList/AgentList';
import { useDeveloper } from '@/contexts/DeveloperContext';
import { useAccount } from 'wagmi';
import Script from 'next/script';
import { Hero } from '@/components/Hero/Hero';

type Agent = {
  agentName: string;
  prompt: string;
  codeSnippet: string;
  contractAddress:string;
  abi:string;
};

const Home = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // const [developerId, setDeveloperId] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentName, setAgentName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState('');
  const [snippet, setSnippet] = useState('');
  const [contractAddress, setContractAddress] = useState('');
  const [abi, setAbi] = useState('');
  const [created, setCreated] = useState(false);
  const { developerId, setDeveloperId } = useDeveloper();
  console.log("Dev Id home:", developerId)
 const { address} = useAccount();

  // Authenticate developer
  const handleAuth = async () => {
    try {
      const response = await axios.post('/api/auth', { email, password });
      setDeveloperId(response.data.developerId);
      localStorage.setItem('developerId', response.data.developerId);
    } catch (err) {
      setError('Authentication failed. Please check your credentials.');
      console.error('Error:', err);
    }
  };

  useEffect(() => {
    const savedDeveloperId = localStorage.getItem('developerId');
    if (savedDeveloperId) {
        setDeveloperId(savedDeveloperId);
    }
}, []);

  const fetchAgents = async (id: string) => {
    try {
      const response = await axios.get('/api/agents', { params: { devId: id } });
      setAgents(response.data);
    } catch (err) {
      console.error('Error fetching agents:', err);
    }
  };

  useEffect(() => {
    if (developerId) {
      fetchAgents(developerId);
    }
  }, [developerId, created]);

  // Create a new agent
  const handleCreateAgent = async () => {
    try {
      const response = await axios.post('/api/agents', {
        developerId,
        agentName,
        prompt,
        contractAddress,
        abi,
      });
      setSnippet(response.data.codeSnippet);
      setAgents([...agents, { agentName, prompt, contractAddress, abi, codeSnippet: response.data.codeSnippet }]);
      setAgentName('');
      setPrompt('');
    } catch (err) {
      console.error('Error creating agent:', err);
    }
  };

  const clearChache = () => {
    localStorage.setItem('developerId', "");
  }

  if (!developerId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        {/* <Script id="chatbot" data-agent-id="67500d5fd8f7b664f8bc39e8" data-account-id={address} src="https://script-sepia.vercel.app/ChatBot.js"></Script> */}
        <div className="relative w-full max-w-md bg-white p-6 rounded-lg shadow-md">
          <div className="absolute top-[-3rem] right-0">
            <div className="clear-cache-btn border-2 border-black  rounded-3xl px-4 py-1 cursor-pointer" onClick={clearChache}>
              <h2 className='text-black font-semibold'>Clear Cache</h2>
            </div>
          </div>
          <h1 className="text-xl font-bold text-center mb-4 text-black">Login / Register</h1>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 mb-4 border rounded-md text-black"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 mb-4 border rounded-md text-black"
          />
          <button
            onClick={handleAuth}
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
          >
            Submit
          </button>
          {error && <p className="text-red-500 text-center mt-2">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full pb-10 bg-gray-100 overflow-hidden">
      {/* <Script id="chatbot" data-agent-id="67500d5fd8f7b664f8bc39e8" data-account-id={address} src="https://script-sepia.vercel.app/ChatBot.js"></Script> */}
      <Header created = {created} />
      {/* <Script id="chatbot" data-agent-id="67518624b0b24db33b575d1b" data-account-id={address} src="https://script-sepia.vercel.app/ChatBot.js"></Script> */}
      <SPABody developerId={developerId} created={created} setCreated={setCreated} />
      <div className="agents-section md:px-[7rem] px-3">
        <AgentList agents={agents} />
      </div>
      <Hero/>
      {/* <div className="max-w-4xl mx-auto"> */}
      {/* <h1 className="text-2xl font-bold mb-6 text-black">Your Agents</h1> */}
      {/* <table className="w-full table-auto bg-white shadow-md rounded-md mb-6 text-black">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-2 text-black">Agent Name</th>
              <th className="px-4 py-2 text-black">Prompt</th>
              <th className="px-4 py-2 text-black">Code Snippet</th>
              <th className="px-4 py-2 text-black">Try it out</th>
            </tr> 
          </thead>
          <tbody>
            {agents.map((agent, index) => (
              <tr key={index} className="border-t">
                <td className="px-4 py-2 text-black">{agent.agentName}</td>
                <td className="px-4 py-2 text-black">{agent.prompt}</td>
                <td className="px-4 py-2 text-black">
                  <code className="text-black">{agent.codeSnippet}</code>
                </td>
                <td className="px-4 py-2">
                  <button className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600">
                    Try it out
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table> */}

      {/* <h2 className="text-xl font-bold mb-4 text-black">Create a New Agent</h2>
        <input
          type="text"
          placeholder="Agent Name"
          value={agentName}
          onChange={(e) => setAgentName(e.target.value)}
          className="w-full px-3 py-2 mb-4 border rounded-md text-black"
        />
        <textarea
          placeholder="Prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full px-3 py-2 mb-4 border rounded-md text-black"
        />
        <button
          onClick={handleCreateAgent}
          className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
        >
          Create
        </button> */}
      {/* {snippet && (
          <div className="mt-6 bg-gray-100 p-4 rounded-md">
            <h3 className="text-lg font-bold mb-2 text-black">Generated Code Snippet</h3>
            <pre className="bg-gray-800 text-white p-3 rounded-md">{snippet}</pre>
          </div>
        )} */}
      {/* </div> */}
    </div>
  );
};

export default Home;
