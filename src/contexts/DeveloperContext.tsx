"use client"
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface DeveloperContextProps {
    developerId: string | null;
    setDeveloperId: (id: string | null) => void;
}

const DeveloperContext = createContext<DeveloperContextProps | undefined>(undefined);

export const DeveloperProvider = ({ children }: { children: ReactNode }) => {
    const [developerId, setDeveloperId] = useState<string | null>(null);

    useEffect(()=> {
        if(developerId) {
            setDeveloperId(developerId);
        }
    }, [developerId])

    return (
        <DeveloperContext.Provider value={{ developerId, setDeveloperId }}>
            {children}
        </DeveloperContext.Provider>
    );
};

export const useDeveloper = () => {
    const context = useContext(DeveloperContext);
    if (!context) {
        throw new Error("useDeveloper must be used within a DeveloperProvider");
    }
    return context;
};
