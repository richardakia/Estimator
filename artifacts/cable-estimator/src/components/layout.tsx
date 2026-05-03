import React from "react";
import { Link, useLocation } from "wouter";
import {
  Calculator,
  Settings,
  BookOpen,
  Plus,
  ChevronDown,
  Route as RouteIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useListEstimates,
  useListPathwayEstimates,
} from "@workspace/api-client-react";
import { useEstimates } from "@/lib/estimates-context";
import { usePathwayEstimates } from "@/lib/pathway-estimates-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { selectedId, setSelectedId, setNewEstOpen } = useEstimates();
  const {
    selectedId: pathwaySelectedId,
    setSelectedId: setPathwaySelectedId,
    setNewEstOpen: setPathwayNewEstOpen,
  } = usePathwayEstimates();
  const { data: estimates = [] } = useListEstimates();
  const { data: pathwayEstimates = [] } = useListPathwayEstimates();

  const navItems = [
    { href: "/", label: "Cabling", icon: Calculator },
    { href: "/pathways", label: "Pathways", icon: RouteIcon },
    { href: "/rates", label: "Rate Editor", icon: Settings },
    { href: "/guide", label: "Platform Guide", icon: BookOpen },
  ];

  const selectedEstimate = estimates.find((e) => e.id === selectedId);
  const selectedPathwayEstimate = pathwayEstimates.find(
    (e) => e.id === pathwaySelectedId,
  );
  const isEstimatorRoute = location === "/";
  const isPathwaysRoute = location === "/pathways";

  const EstimatesDropdown = () => (
    <div className="mt-3 space-y-1">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-1 mb-2">
        Saved Estimates
      </p>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between text-left font-normal h-auto py-2 px-3"
            data-testid="dropdown-estimates"
          >
            <span className="truncate text-sm">
              {selectedEstimate ? selectedEstimate.name : "Select an estimate…"}
            </span>
            <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-56"
          align="start"
          side="bottom"
          sideOffset={4}
        >
          {estimates.length === 0 ? (
            <DropdownMenuItem disabled>No estimates yet</DropdownMenuItem>
          ) : (
            estimates.map((e) => (
              <DropdownMenuItem
                key={e.id}
                onSelect={() => setSelectedId(e.id)}
                className={cn(
                  "flex flex-col items-start gap-0.5 cursor-pointer",
                  e.id === selectedId && "bg-primary/10 text-primary"
                )}
                data-testid={`dropdown-item-${e.id}`}
              >
                <span className="font-medium text-sm truncate max-w-[180px]">
                  {e.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {e.runCount} run{e.runCount === 1 ? "" : "s"} · {e.totalDrops} cables
                </span>
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setNewEstOpen(true)}
            className="text-primary font-medium cursor-pointer"
            data-testid="dropdown-new-estimate"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Estimate
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const PathwayEstimatesDropdown = () => (
    <div className="mt-3 space-y-1">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-1 mb-2">
        Saved Pathway Estimates
      </p>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between text-left font-normal h-auto py-2 px-3"
            data-testid="dropdown-pathway-estimates"
          >
            <span className="truncate text-sm">
              {selectedPathwayEstimate
                ? selectedPathwayEstimate.name
                : "Select an estimate…"}
            </span>
            <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-56"
          align="start"
          side="bottom"
          sideOffset={4}
        >
          {pathwayEstimates.length === 0 ? (
            <DropdownMenuItem disabled>No estimates yet</DropdownMenuItem>
          ) : (
            pathwayEstimates.map((e) => (
              <DropdownMenuItem
                key={e.id}
                onSelect={() => setPathwaySelectedId(e.id)}
                className={cn(
                  "flex flex-col items-start gap-0.5 cursor-pointer",
                  e.id === pathwaySelectedId && "bg-primary/10 text-primary",
                )}
                data-testid={`dropdown-pathway-item-${e.id}`}
              >
                <span className="font-medium text-sm truncate max-w-[180px]">
                  {e.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {e.segmentCount} path{e.segmentCount === 1 ? "" : "s"} ·{" "}
                  {e.totalLengthFt.toLocaleString()} ft
                </span>
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setPathwayNewEstOpen(true)}
            className="text-primary font-medium cursor-pointer"
            data-testid="dropdown-new-pathway-estimate"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Pathway Estimate
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
            <Calculator className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight leading-tight whitespace-pre-line">{"AKIA-AV\nSC Labor Estimator"}</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors",
                  location === item.href
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                data-testid={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </div>
            </Link>
          ))}

          {isEstimatorRoute && <EstimatesDropdown />}
          {isPathwaysRoute && <PathwayEstimatesDropdown />}
        </nav>
        <div className="p-4 border-t border-border text-xs text-muted-foreground">
          v1.0.0 Field Tool
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-[100dvh] overflow-x-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Calculator className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold leading-tight whitespace-pre-line text-sm">{"AKIA-AV\nSC Labor Estimator"}</span>
          </div>
          {isEstimatorRoute && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="max-w-[160px]">
                  <span className="truncate text-xs">
                    {selectedEstimate ? selectedEstimate.name : "Select…"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 ml-1.5 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {estimates.map((e) => (
                  <DropdownMenuItem
                    key={e.id}
                    onSelect={() => setSelectedId(e.id)}
                    className={cn(e.id === selectedId && "bg-primary/10 text-primary")}
                  >
                    {e.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => setNewEstOpen(true)}
                  className="text-primary font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Estimate
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {isPathwaysRoute && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="max-w-[160px]">
                  <span className="truncate text-xs">
                    {selectedPathwayEstimate
                      ? selectedPathwayEstimate.name
                      : "Select…"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 ml-1.5 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {pathwayEstimates.map((e) => (
                  <DropdownMenuItem
                    key={e.id}
                    onSelect={() => setPathwaySelectedId(e.id)}
                    className={cn(
                      e.id === pathwaySelectedId && "bg-primary/10 text-primary",
                    )}
                  >
                    {e.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => setPathwayNewEstOpen(true)}
                  className="text-primary font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Pathway Estimate
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </header>

        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden flex items-center justify-around p-3 border-t border-border bg-card">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-md",
                  location === item.href ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px]">{item.label}</span>
              </div>
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
