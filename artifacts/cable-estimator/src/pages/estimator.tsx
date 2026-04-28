import React, { useMemo, useState } from "react";
import { useRates, CableType, InstallType, CeilingType, PathwayComplexity, BuildingType, WorkEnvironment, SkillLevel } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Printer, Calculator as CalculatorIcon, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";

export default function Estimator() {
  const { rates, isLoaded } = useRates();

  // State
  const [projectName, setProjectName] = useState("");
  const [installType, setInstallType] = useState<InstallType>("New Install");
  const [buildingType, setBuildingType] = useState<BuildingType>("Office");
  const [workEnv, setWorkEnv] = useState<WorkEnvironment>("Unoccupied");

  const [numDrops, setNumDrops] = useState<number>(24);
  const [cableType, setCableType] = useState<CableType>("Cat6");
  const [avgLength, setAvgLength] = useState<number>(120);

  const [ceilingType, setCeilingType] = useState<CeilingType>("Drywall/T-bar");
  const [pathway, setPathway] = useState<PathwayComplexity>("Medium");
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("Journeyman");

  const [hourlyRate, setHourlyRate] = useState<number>(75);

  // Derived calculations
  const calculations = useMemo(() => {
    if (!isLoaded) return null;

    const baseHrs = rates.cableTypes[cableType];
    const mInstall = rates.installTypes[installType];
    const mCeiling = rates.ceilingTypes[ceilingType];
    const mPathway = rates.pathwayComplexity[pathway];
    const mBuilding = rates.buildingTypes[buildingType];
    const mEnv = rates.workEnvironment[workEnv];
    const mSkill = rates.skillLevels[skillLevel];

    let lengthAdd = 0;
    if (avgLength > 250) lengthAdd = 0.35;
    else if (avgLength > 150) lengthAdd = 0.15;

    const adjustedHoursPerDrop = (baseHrs * mInstall * mCeiling * mPathway * mBuilding * mEnv * mSkill) + lengthAdd;
    const totalHoursAvg = adjustedHoursPerDrop * numDrops;
    
    const lowHours = totalHoursAvg * 0.85;
    const highHours = totalHoursAvg * 1.20;

    const avgCost = totalHoursAvg * hourlyRate;
    const lowCost = lowHours * hourlyRate;
    const highCost = highHours * hourlyRate;

    const taskBreakdown = [
      { name: "Cable Pull", pct: 0.35 },
      { name: "Term & Test", pct: 0.30 },
      { name: "Label & Doc", pct: 0.10 },
      { name: "Pathway", pct: 0.15 },
      { name: "Cleanup", pct: 0.10 },
    ].map(t => ({
      name: t.name,
      hours: totalHoursAvg * t.pct,
      cost: totalHoursAvg * t.pct * hourlyRate
    }));

    return {
      baseHrs,
      multipliers: { mInstall, mCeiling, mPathway, mBuilding, mEnv, mSkill, lengthAdd },
      adjustedHoursPerDrop,
      totalHoursAvg,
      lowHours,
      highHours,
      avgCost,
      lowCost,
      highCost,
      taskBreakdown
    };
  }, [rates, isLoaded, cableType, installType, ceilingType, pathway, buildingType, workEnv, skillLevel, avgLength, numDrops, hourlyRate]);

  if (!isLoaded || !calculations) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading engine...</div>;

  const chartData = [
    { name: "Optimistic", hours: calculations.lowHours, fill: "hsl(var(--chart-3))" },
    { name: "Expected", hours: calculations.totalHoursAvg, fill: "hsl(var(--primary))" },
    { name: "Conservative", hours: calculations.highHours, fill: "hsl(var(--chart-4))" },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto pb-20">
      <div className="lg:col-span-5 space-y-6 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CalculatorIcon className="w-8 h-8 text-primary" />
            Estimator
          </h1>
          <p className="text-muted-foreground mt-1">Configure project variables to calculate labor requirements.</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">1. Project Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Project Name (Optional)</Label>
              <Input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="e.g. Acme Corp HQ" data-testid="input-project-name" />
            </div>
            
            <div className="space-y-2">
              <Label>Installation Type</Label>
              <Select value={installType} onValueChange={(v: InstallType) => setInstallType(v)}>
                <SelectTrigger data-testid="select-install-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New Install">New Install</SelectItem>
                  <SelectItem value="Retrofit">Retrofit</SelectItem>
                  <SelectItem value="De-install">De-install</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Building Type</Label>
                <Select value={buildingType} onValueChange={(v: BuildingType) => setBuildingType(v)}>
                  <SelectTrigger data-testid="select-building-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Office">Office</SelectItem>
                    <SelectItem value="Warehouse">Warehouse</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Work Environment</Label>
                <Select value={workEnv} onValueChange={(v: WorkEnvironment) => setWorkEnv(v)}>
                  <SelectTrigger data-testid="select-work-env">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Unoccupied">Unoccupied</SelectItem>
                    <SelectItem value="Occupied">Occupied</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">2. Cable Drops</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Number of Drops</Label>
                <Input type="number" min={1} value={numDrops} onChange={e => setNumDrops(Number(e.target.value) || 1)} data-testid="input-num-drops" />
              </div>
              <div className="space-y-2">
                <Label>Avg. Length (ft)</Label>
                <Input type="number" min={1} value={avgLength} onChange={e => setAvgLength(Number(e.target.value) || 0)} data-testid="input-avg-length" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cable Type</Label>
              <Select value={cableType} onValueChange={(v: CableType) => setCableType(v)}>
                <SelectTrigger data-testid="select-cable-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(rates.cableTypes).map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">3. Environmental Factors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Ceiling Type</Label>
              <Select value={ceilingType} onValueChange={(v: CeilingType) => setCeilingType(v)}>
                <SelectTrigger data-testid="select-ceiling">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Drywall/T-bar">Drywall/T-bar</SelectItem>
                  <SelectItem value="Hard-lid/Concrete">Hard-lid/Concrete</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pathway Complexity</Label>
                <Select value={pathway} onValueChange={(v: PathwayComplexity) => setPathway(v)}>
                  <SelectTrigger data-testid="select-pathway">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Labor Skill Level</Label>
                <Select value={skillLevel} onValueChange={(v: SkillLevel) => setSkillLevel(v)}>
                  <SelectTrigger data-testid="select-skill">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Apprentice">Apprentice</SelectItem>
                    <SelectItem value="Journeyman">Journeyman</SelectItem>
                    <SelectItem value="Lead/Foreman">Lead/Foreman</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">4. Financial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Hourly Labor Rate ($)</Label>
              <Input type="number" min={1} value={hourlyRate} onChange={e => setHourlyRate(Number(e.target.value) || 0)} data-testid="input-hourly-rate" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-7 space-y-6">
        <div className="sticky top-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold tracking-tight">Estimate Results</h2>
            <Button variant="outline" size="sm" onClick={handlePrint} className="print:hidden">
              <Printer className="w-4 h-4 mr-2" />
              Print / Export
            </Button>
          </div>

          {projectName && <h3 className="text-xl font-medium text-primary mb-4 hidden print:block">{projectName}</h3>}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-primary/10 border-primary/20">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Hours</p>
                <p className="text-3xl font-bold font-mono text-primary" data-testid="val-total-hours">{calculations.totalHoursAvg.toFixed(1)}h</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/10 border-primary/20">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Labor Cost</p>
                <p className="text-3xl font-bold font-mono text-primary" data-testid="val-total-cost">${calculations.avgCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Hours / Drop</p>
                <p className="text-3xl font-bold font-mono" data-testid="val-hours-per-drop">{calculations.adjustedHoursPerDrop.toFixed(2)}h</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardHeader className="pb-2 border-b border-border/50">
              <CardTitle className="text-base">Variance Scenarios</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-3 divide-x divide-border">
                <div className="p-4 text-center">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Low (-15%)</p>
                  <p className="text-xl font-bold font-mono text-chart-3">{calculations.lowHours.toFixed(1)}h</p>
                  <p className="text-sm font-mono text-muted-foreground">${calculations.lowCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="p-4 text-center bg-muted/20">
                  <p className="text-sm font-bold text-foreground mb-2">Average</p>
                  <p className="text-xl font-bold font-mono text-primary">{calculations.totalHoursAvg.toFixed(1)}h</p>
                  <p className="text-sm font-mono text-muted-foreground">${calculations.avgCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="p-4 text-center">
                  <p className="text-sm font-medium text-muted-foreground mb-2">High (+20%)</p>
                  <p className="text-xl font-bold font-mono text-chart-4">{calculations.highHours.toFixed(1)}h</p>
                  <p className="text-sm font-mono text-muted-foreground">${calculations.highCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6 print:hidden">
            <CardContent className="pt-6 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}h`} />
                  <RechartsTooltip 
                    cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '4px', color: 'hsl(var(--foreground))' }}
                    itemStyle={{ color: 'hsl(var(--primary))' }}
                    formatter={(val: number) => [`${val.toFixed(1)}h`, 'Hours']}
                  />
                  <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Task Breakdown (Average Scenario)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left font-medium p-3">Phase</th>
                    <th className="text-right font-medium p-3">Hours</th>
                    <th className="text-right font-medium p-3">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {calculations.taskBreakdown.map((task) => (
                    <tr key={task.name}>
                      <td className="p-3">{task.name}</td>
                      <td className="p-3 text-right font-mono">{task.hours.toFixed(1)}h</td>
                      <td className="p-3 text-right font-mono">${task.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card className="bg-muted/30 print:hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium mb-2">Active Multipliers Summary</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="font-mono text-xs">Base: {calculations.baseHrs}h</Badge>
                    {calculations.multipliers.mInstall !== 1 && <Badge variant="outline" className="font-mono text-xs">Install: {calculations.multipliers.mInstall}x</Badge>}
                    {calculations.multipliers.mCeiling !== 1 && <Badge variant="outline" className="font-mono text-xs">Ceiling: {calculations.multipliers.mCeiling}x</Badge>}
                    {calculations.multipliers.mPathway !== 1 && <Badge variant="outline" className="font-mono text-xs">Pathway: {calculations.multipliers.mPathway}x</Badge>}
                    {calculations.multipliers.mBuilding !== 1 && <Badge variant="outline" className="font-mono text-xs">Bldg: {calculations.multipliers.mBuilding}x</Badge>}
                    {calculations.multipliers.mEnv !== 1 && <Badge variant="outline" className="font-mono text-xs">Env: {calculations.multipliers.mEnv}x</Badge>}
                    {calculations.multipliers.mSkill !== 1 && <Badge variant="outline" className="font-mono text-xs">Skill: {calculations.multipliers.mSkill}x</Badge>}
                    {calculations.multipliers.lengthAdd > 0 && <Badge variant="outline" className="font-mono text-xs">Length Add: +{calculations.multipliers.lengthAdd}h</Badge>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
