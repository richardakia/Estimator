import React from "react";
import { BookOpen, CheckCircle2, Database, Map, Layers, Lightbulb, Smartphone, Cpu, History, Network, FileText, Calendar, DollarSign, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Guide() {
  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 mb-2">
          <BookOpen className="w-8 h-8 text-primary" />
          Platform Guide
        </h1>
        <p className="text-muted-foreground text-lg">System architecture, recommended workflows, and enhancement roadmap.</p>
      </div>

      <section>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Layers className="w-6 h-6 text-primary" />
          1. Platform Recommendations
        </h2>
        <Card>
          <CardContent className="pt-6">
            <p className="mb-4 text-muted-foreground">The <strong>Web App (React/HTML)</strong> is the recommended primary platform for field estimators due to its balance of accessibility, maintainability, and user experience. Below is a comparison of alternatives.</p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="p-3 font-medium">Platform</th>
                    <th className="p-3 font-medium">Offline</th>
                    <th className="p-3 font-medium">Multi-user</th>
                    <th className="p-3 font-medium">Customizable Rates</th>
                    <th className="p-3 font-medium">Historical Learning</th>
                    <th className="p-3 font-medium">Mobile-Friendly</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="p-3 font-medium text-primary">Web App (React)</td>
                    <td className="p-3">Yes (via PWA)</td>
                    <td className="p-3">Yes (with backend)</td>
                    <td className="p-3">Yes</td>
                    <td className="p-3">Yes</td>
                    <td className="p-3"><CheckCircle2 className="w-4 h-4 text-green-500" /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Excel / Sheets</td>
                    <td className="p-3">Yes</td>
                    <td className="p-3">Poor</td>
                    <td className="p-3">Yes</td>
                    <td className="p-3">Manual</td>
                    <td className="p-3 text-muted-foreground">Clunky</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">SQL + UI (Enterprise)</td>
                    <td className="p-3">No</td>
                    <td className="p-3">Excellent</td>
                    <td className="p-3">Yes</td>
                    <td className="p-3">Excellent</td>
                    <td className="p-3">Depends on UI</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Database className="w-6 h-6 text-primary" />
          2. Scalable Data Model
        </h2>
        <Card>
          <CardContent className="pt-6">
            <p className="mb-4 text-muted-foreground">For multi-user or enterprise deployments, this relational model supports historical tracking and rate tuning.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              <div className="bg-muted/30 p-4 rounded border border-border">
                <h3 className="font-bold text-primary mb-2 text-sm">projects</h3>
                <ul className="space-y-1 text-muted-foreground">
                  <li>id (UUID) PK</li>
                  <li>name (String)</li>
                  <li>created_at (Timestamp)</li>
                  <li>estimator_id (UUID) FK</li>
                  <li>status (Enum)</li>
                </ul>
              </div>
              <div className="bg-muted/30 p-4 rounded border border-border">
                <h3 className="font-bold text-primary mb-2 text-sm">estimates</h3>
                <ul className="space-y-1 text-muted-foreground">
                  <li>id (UUID) PK</li>
                  <li>project_id (UUID) FK</li>
                  <li>cable_type, num_drops...</li>
                  <li>[... all environmental factors]</li>
                  <li>total_hours_avg (Float)</li>
                  <li>total_cost_avg (Float)</li>
                </ul>
              </div>
              <div className="bg-muted/30 p-4 rounded border border-border">
                <h3 className="font-bold text-primary mb-2 text-sm">labor_rate_configs</h3>
                <ul className="space-y-1 text-muted-foreground">
                  <li>id (UUID) PK</li>
                  <li>name (String)</li>
                  <li>base_hours_per_drop (Float)</li>
                  <li>[... all multiplier fields]</li>
                  <li>is_default (Boolean)</li>
                </ul>
              </div>
              <div className="bg-muted/30 p-4 rounded border border-border">
                <h3 className="font-bold text-primary mb-2 text-sm">historical_actuals</h3>
                <ul className="space-y-1 text-muted-foreground">
                  <li>id (UUID) PK</li>
                  <li>estimate_id (UUID) FK</li>
                  <li>actual_hours (Float)</li>
                  <li>actual_cost (Float)</li>
                  <li>notes (Text)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Map className="w-6 h-6 text-primary" />
          3. Field Estimator Workflow
        </h2>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[
                "Walk the job site → note building type, ceiling, pathway complexity.",
                "Count or estimate drops from floor plans or drawings.",
                "Measure or estimate average run lengths.",
                "Open the Estimator tool and fill in Project Setup.",
                "Enter drop counts and environmental factors.",
                "Review the Low/Avg/High output to gauge risk.",
                "Adjust skill level based on available crew composition.",
                "Export or print the estimate for the quote package.",
                "After job completion, record actuals for historical learning."
              ].map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                    {i + 1}
                  </div>
                  <p className="pt-0.5">{step}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-primary" />
          4. Future Enhancements Roadmap
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-primary" /> Mobile PWA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Offline-capable app with camera integration for site photos.</p>
              <div className="flex gap-2">
                <Badge variant="destructive">High Priority</Badge>
                <Badge variant="outline">Medium Effort</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Cpu className="w-4 h-4 text-primary" /> AI-Assisted Takeoff
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Upload floor plans and have AI automatically count drops.</p>
              <div className="flex gap-2">
                <Badge variant="destructive">High Priority</Badge>
                <Badge variant="secondary">High Effort</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="w-4 h-4 text-primary" /> Historical Job Learning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Actual vs. estimate feedback loop to auto-tune rate multipliers.</p>
              <div className="flex gap-2">
                <Badge variant="destructive">High Priority</Badge>
                <Badge variant="secondary">High Effort</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> Quote PDF Generation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Client-ready professional PDF exports with company branding.</p>
              <div className="flex gap-2">
                <Badge variant="destructive">High Priority</Badge>
                <Badge variant="outline">Low Effort</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Network className="w-4 h-4 text-primary" /> Multi-trade Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Expand modules for electrical, AV, and security systems.</p>
              <div className="flex gap-2">
                <Badge variant="default" className="bg-primary text-primary-foreground">Med Priority</Badge>
                <Badge variant="secondary">High Effort</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> Crew Scheduling
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Tie estimates directly to dispatch and calendar systems.</p>
              <div className="flex gap-2">
                <Badge variant="default" className="bg-primary text-primary-foreground">Med Priority</Badge>
                <Badge variant="outline">Medium Effort</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" /> Material Cost Module
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Live pricing for cable, connectors, and hardware.</p>
              <div className="flex gap-2">
                <Badge variant="default" className="bg-primary text-primary-foreground">Med Priority</Badge>
                <Badge variant="outline">Medium Effort</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" /> Regional Labor Rates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">ZIP-code-based prevailing wage integration database.</p>
              <div className="flex gap-2">
                <Badge variant="secondary">Low Priority</Badge>
                <Badge variant="secondary">High Effort</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

    </div>
  );
}
