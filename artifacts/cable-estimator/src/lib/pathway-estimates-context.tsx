import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface PathwayEstimatesContextValue {
  selectedId: number | null;
  setSelectedId: (id: number | null) => void;
  newEstOpen: boolean;
  setNewEstOpen: (open: boolean) => void;
}

const PathwayEstimatesContext = createContext<PathwayEstimatesContextValue | null>(
  null,
);

export function PathwayEstimatesProvider({ children }: { children: ReactNode }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [newEstOpen, setNewEstOpen] = useState(false);

  return (
    <PathwayEstimatesContext.Provider
      value={{ selectedId, setSelectedId, newEstOpen, setNewEstOpen }}
    >
      {children}
    </PathwayEstimatesContext.Provider>
  );
}

export function usePathwayEstimates(): PathwayEstimatesContextValue {
  const ctx = useContext(PathwayEstimatesContext);
  if (!ctx)
    throw new Error(
      "usePathwayEstimates must be used within PathwayEstimatesProvider",
    );
  return ctx;
}
