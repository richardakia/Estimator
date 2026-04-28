import { useState, useEffect } from "react";

export type CableType = "Cat5e" | "Cat6" | "Cat6A" | "SM Fiber" | "MM Fiber" | "Coax RG6" | "Coax RG11";
export type InstallType = "New Install" | "Retrofit" | "De-install";
export type CeilingType = "Open" | "Drywall/T-bar" | "Hard-lid/Concrete";
export type PathwayComplexity = "Low" | "Medium" | "High";
export type BuildingType = "Office" | "Warehouse" | "Retail" | "Healthcare";
export type WorkEnvironment = "Occupied" | "Unoccupied";
export type SkillLevel = "Apprentice" | "Journeyman" | "Lead/Foreman";

export interface RatesConfig {
  cableTypes: Record<CableType, number>;
  installTypes: Record<InstallType, number>;
  ceilingTypes: Record<CeilingType, number>;
  pathwayComplexity: Record<PathwayComplexity, number>;
  buildingTypes: Record<BuildingType, number>;
  workEnvironment: Record<WorkEnvironment, number>;
  skillLevels: Record<SkillLevel, number>;
}

export const defaultRates: RatesConfig = {
  cableTypes: {
    "Cat5e": 0.75,
    "Cat6": 0.85,
    "Cat6A": 1.00,
    "SM Fiber": 1.50,
    "MM Fiber": 1.40,
    "Coax RG6": 0.65,
    "Coax RG11": 0.80,
  },
  installTypes: {
    "New Install": 1.0,
    "Retrofit": 1.35,
    "De-install": 0.50,
  },
  ceilingTypes: {
    "Open": 1.0,
    "Drywall/T-bar": 1.20,
    "Hard-lid/Concrete": 1.55,
  },
  pathwayComplexity: {
    "Low": 0.90,
    "Medium": 1.0,
    "High": 1.30,
  },
  buildingTypes: {
    "Office": 1.0,
    "Warehouse": 0.85,
    "Retail": 1.15,
    "Healthcare": 1.40,
  },
  workEnvironment: {
    "Unoccupied": 1.0,
    "Occupied": 1.20,
  },
  skillLevels: {
    "Lead/Foreman": 0.85,
    "Journeyman": 1.0,
    "Apprentice": 1.35,
  }
};

const STORAGE_KEY = "cabling-rates-config";

export function useRates() {
  const [rates, setRates] = useState<RatesConfig>(defaultRates);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRates(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load rates from local storage", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const updateRates = (newRates: RatesConfig) => {
    setRates(newRates);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRates));
  };

  const resetRates = () => {
    setRates(defaultRates);
    localStorage.removeItem(STORAGE_KEY);
  };

  return { rates, updateRates, resetRates, isLoaded };
}
