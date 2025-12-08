import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ScenarioContextType {
  currentScenarioId: number | null;
  setCurrentScenarioId: (id: number | null) => void;
}

const ScenarioContext = createContext<ScenarioContextType | undefined>(undefined);

export function ScenarioProvider({ children }: { children: ReactNode }) {
  const [currentScenarioId, setCurrentScenarioId] = useState<number | null>(null);

  return (
    <ScenarioContext.Provider value={{ currentScenarioId, setCurrentScenarioId }}>
      {children}
    </ScenarioContext.Provider>
  );
}

export function useScenario() {
  const context = useContext(ScenarioContext);
  if (context === undefined) {
    throw new Error('useScenario must be used within a ScenarioProvider');
  }
  return context;
}
