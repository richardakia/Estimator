import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { EstimatesProvider } from "@/lib/estimates-context";
import { PathwayEstimatesProvider } from "@/lib/pathway-estimates-context";
import Estimator from "@/pages/estimator";
import RatesEditor from "@/pages/rates";
import MaterialsEditor from "@/pages/materials";
import Guide from "@/pages/guide";
import LocalDeploy from "@/pages/local-deploy";
import Pathways from "@/pages/pathways";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Estimator} />
        <Route path="/pathways" component={Pathways} />
        <Route path="/rates" component={RatesEditor} />
        <Route path="/materials" component={MaterialsEditor} />
        <Route path="/guide" component={Guide} />
        <Route path="/local-deploy" component={LocalDeploy} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <EstimatesProvider>
            <PathwayEstimatesProvider>
              <Router />
            </PathwayEstimatesProvider>
          </EstimatesProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
