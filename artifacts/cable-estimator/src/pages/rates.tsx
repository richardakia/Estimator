import React from "react";
import { useRates, RatesConfig, defaultRates } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RotateCcw, Settings, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function RatesEditor() {
  const { rates, updateRates, resetRates, isLoaded } = useRates();
  const { toast } = useToast();

  if (!isLoaded) return <div className="p-8">Loading...</div>;

  const handleUpdate = (category: keyof RatesConfig, key: string, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    const newRates = {
      ...rates,
      [category]: {
        ...rates[category],
        [key]: numValue
      }
    };
    updateRates(newRates);
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all rates to factory defaults?")) {
      resetRates();
      toast({
        title: "Rates reset",
        description: "All multipliers and base rates have been restored.",
      });
    }
  };

  const renderSection = (title: string, category: keyof RatesConfig, description: string, isMultiplier = true) => {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(rates[category]).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-3 rounded-md bg-muted/30 border border-border/50">
                <span className="font-medium text-sm">{key}</span>
                <div className="flex items-center gap-2">
                  <Input 
                    type="number" 
                    step="0.01" 
                    className="w-24 h-8 text-right font-mono" 
                    value={value} 
                    onChange={(e) => handleUpdate(category, key, e.target.value)}
                  />
                  <span className="text-muted-foreground text-sm font-mono">{isMultiplier ? 'x' : 'hrs'}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="w-8 h-8 text-primary" />
            Rate Editor
          </h1>
          <p className="text-muted-foreground mt-1">Configure base productivity rates and condition multipliers. Changes are saved locally.</p>
        </div>
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset to Defaults
        </Button>
      </div>

      <div className="bg-primary/10 border border-primary/20 rounded-md p-4 mb-8 flex items-start gap-3">
        <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <p className="text-sm">These rates are used in all estimates. The calculation is: <strong className="font-mono text-primary">Base Hours × (All Active Multipliers) + Length Factor</strong>.</p>
      </div>

      {renderSection("Base Cable Installation Rates", "cableTypes", "Base hours to install one drop under optimal conditions.", false)}
      {renderSection("Installation Type Multipliers", "installTypes", "Adjustments for project lifecycle phase.")}
      {renderSection("Ceiling Type Multipliers", "ceilingTypes", "Adjustments for overhead access difficulty.")}
      {renderSection("Pathway Complexity Multipliers", "pathwayComplexity", "Adjustments for routing challenges.")}
      {renderSection("Building Type Multipliers", "buildingTypes", "Adjustments for site-specific conditions and overhead.")}
      {renderSection("Work Environment Multipliers", "workEnvironment", "Adjustments for active vs passive spaces.")}
      {renderSection("Skill Level Multipliers", "skillLevels", "Adjustments based on crew composition.")}
    </div>
  );
}
