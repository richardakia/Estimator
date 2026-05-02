import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface EstimatesContextValue {
  selectedId: number | null;
  setSelectedId: (id: number | null) => void;
  newEstOpen: boolean;
  setNewEstOpen: (open: boolean) => void;
}

const EstimatesContext = createContext<EstimatesContextValue | null>(null);

export function EstimatesProvider({ children }: { children: ReactNode }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [newEstOpen, setNewEstOpen] = useState(false);

  return (
    <EstimatesContext.Provider
      value={{ selectedId, setSelectedId, newEstOpen, setNewEstOpen }}
    >
      {children}
    </EstimatesContext.Provider>
  );
}

export function useEstimates(): EstimatesContextValue {
  const ctx = useContext(EstimatesContext);
  if (!ctx) throw new Error("useEstimates must be used within EstimatesProvider");
  return ctx;
}
