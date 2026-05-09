import {
  Server,
  Download,
  Database,
  Terminal,
  Globe,
  ShieldCheck,
  AlertTriangle,
  Wrench,
  Rocket,
  Package,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
      {children}
    </code>
  );
}

function Block({ children }: { children: string }) {
  return (
    <pre className="bg-zinc-950 text-zinc-100 text-xs font-mono rounded-md p-4 overflow-x-auto whitespace-pre">
      {children}
    </pre>
  );
}

function Step({
  n,
  title,
  icon: Icon,
  children,
}: {
  n: number;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
          {n}
        </div>
        <CardTitle className="text-lg flex items-center gap-2">
          <Icon className="w-5 h-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">{children}</CardContent>
    </Card>
  );
}

export default function LocalDeploy() {
  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 mb-2">
          <Server className="w-8 h-8 text-primary" />
          Run This App on Your Local Computer
        </h1>
        <p className="text-muted-foreground text-lg">
          Step-by-step instructions for installing and running the Cabling
          Labor Estimator on your own machine (Windows, macOS, or Linux).
        </p>
      </div>

      {/* Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            What You Need
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid sm:grid-cols-2 gap-2 text-sm">
            <li className="flex items-center gap-2">
              <Badge variant="secondary">Required</Badge> Node.js{" "}
              <strong>v24+</strong>
            </li>
            <li className="flex items-center gap-2">
              <Badge variant="secondary">Required</Badge> pnpm{" "}
              <strong>v9+</strong>
            </li>
            <li className="flex items-center gap-2">
              <Badge variant="secondary">Required</Badge> PostgreSQL{" "}
              <strong>v14+</strong>
            </li>
            <li className="flex items-center gap-2">
              <Badge variant="secondary">Required</Badge> Git
            </li>
          </ul>
          <p className="text-xs text-muted-foreground mt-3">
            ~500&nbsp;MB free disk space. Any modern OS works (Windows 10/11,
            macOS 12+, Ubuntu 20.04+).
          </p>
        </CardContent>
      </Card>

      {/* Steps */}
      <Step n={1} title="Install Prerequisites" icon={Download}>
        <p>
          Install <strong>Node.js 24</strong> from{" "}
          <a
            className="text-primary underline"
            href="https://nodejs.org/"
            target="_blank"
            rel="noreferrer"
          >
            nodejs.org
          </a>{" "}
          (LTS or current). Then install <strong>pnpm</strong>:
        </p>
        <Block>{`# Install pnpm globally via corepack (bundled with Node 24)
corepack enable
corepack prepare pnpm@latest --activate

# Verify
node --version    # → v24.x.x
pnpm --version    # → 9.x or 10.x`}</Block>
        <p>
          Install <strong>PostgreSQL</strong>:
        </p>
        <ul className="list-disc list-inside text-sm space-y-1 ml-2">
          <li>
            <strong>Windows / macOS:</strong> download from{" "}
            <a
              className="text-primary underline"
              href="https://www.postgresql.org/download/"
              target="_blank"
              rel="noreferrer"
            >
              postgresql.org
            </a>
            .
          </li>
          <li>
            <strong>macOS (Homebrew):</strong>{" "}
            <Code>brew install postgresql@16 && brew services start postgresql@16</Code>
          </li>
          <li>
            <strong>Ubuntu/Debian:</strong>{" "}
            <Code>sudo apt install postgresql && sudo systemctl start postgresql</Code>
          </li>
        </ul>
      </Step>

      <Step n={2} title="Choose an Install Folder" icon={Wrench}>
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          <p className="font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Important — do NOT install into a system folder.
          </p>
          <p className="text-muted-foreground mt-1">
            Avoid locations like <Code>C:\Windows</Code>,{" "}
            <Code>C:\Program Files</Code>, <Code>/usr</Code>,{" "}
            <Code>/opt</Code>, <Code>/etc</Code>, or the root of your drive.
            Pick a folder you own (your user profile or Documents) so the app
            can read and write files without administrator/root permissions.
          </p>
        </div>
        <p>
          Open a terminal and change into the folder where you want the app
          installed. A new <Code>cable-estimator</Code> subfolder will be
          created inside it in the next step.
        </p>
        <p className="font-semibold">Recommended locations:</p>
        <Block>{`# Windows (PowerShell or Command Prompt)
cd %USERPROFILE%\\Documents
mkdir Apps
cd Apps

# macOS / Linux
cd ~/Documents
mkdir -p Apps
cd Apps

# Confirm where you are before cloning:
#   Windows:  cd
#   macOS/Linux:  pwd`}</Block>
        <p className="text-xs text-muted-foreground">
          You can use any folder you like — just make sure it's inside your
          user profile (e.g. <Code>C:\Users\YourName\…</Code> on Windows or{" "}
          <Code>/home/yourname/…</Code> / <Code>/Users/yourname/…</Code> on
          macOS/Linux), and never inside a protected system directory.
        </p>
      </Step>

      <Step n={3} title="Get the Code" icon={Terminal}>
        <p>
          From the folder you chose in the previous step, clone the
          repository and install dependencies:
        </p>
        <Block>{`git clone <your-repo-url> cable-estimator
cd cable-estimator
pnpm install`}</Block>
        <p className="text-xs text-muted-foreground">
          The first install pulls down all workspace packages and may take 1–2
          minutes.
        </p>
      </Step>

      <Step n={4} title="Create the Database" icon={Database}>
        <p>
          Open a terminal and create an empty Postgres database for the app:
        </p>
        <Block>{`# Connect to Postgres (default superuser is "postgres")
psql -U postgres

# Inside psql:
CREATE DATABASE cable_estimator;
CREATE USER estimator WITH PASSWORD 'changeme';
GRANT ALL PRIVILEGES ON DATABASE cable_estimator TO estimator;
\\q`}</Block>
        <p>
          Your connection string will be:{" "}
          <Code>postgres://estimator:changeme@localhost:5432/cable_estimator</Code>
        </p>
      </Step>

      <Step n={5} title="Configure Environment Variables" icon={Wrench}>
        <p>
          Create a <Code>.env</Code> file in the project root:
        </p>
        <Block>{`# .env
DATABASE_URL=postgres://estimator:changeme@localhost:5432/cable_estimator
SESSION_SECRET=replace-with-a-long-random-string
NODE_ENV=development
PORT=8080`}</Block>
        <p>
          Generate a random <Code>SESSION_SECRET</Code> with:
        </p>
        <Block>{`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`}</Block>
      </Step>

      <Step n={6} title="Push the Database Schema" icon={Database}>
        <p>
          Apply the Drizzle schema to create all tables (estimates, runs,
          rates, pathway estimates, hardware items, etc.):
        </p>
        <Block>{`pnpm --filter @workspace/db run push`}</Block>
        <p className="text-xs text-muted-foreground">
          On first run, default rates are seeded automatically when the API
          server starts.
        </p>
      </Step>

      <Step n={7} title="Start the API Server" icon={Server}>
        <p>In one terminal window:</p>
        <Block>{`pnpm --filter @workspace/api-server run dev`}</Block>
        <p>
          You should see{" "}
          <Code>Server listening port: 8080</Code> in the output.
        </p>
      </Step>

      <Step n={8} title="Start the Web App" icon={Globe}>
        <p>In a second terminal window (leave the API running):</p>
        <Block>{`pnpm --filter @workspace/cable-estimator run dev`}</Block>
        <p>
          Vite will print a local URL such as{" "}
          <Code>http://localhost:5173/</Code>. Open it in your browser — you
          should see the Cabling Estimator home page.
        </p>
      </Step>

      <Step n={9} title="Verify It Works" icon={Rocket}>
        <ul className="list-disc list-inside space-y-1.5">
          <li>
            Navigate to <Code>/rates</Code> and confirm the default rate values
            load.
          </li>
          <li>
            Create a test estimate, add a run, and confirm hours + cost compute.
          </li>
          <li>
            Visit <Code>/pathways</Code> and add a segment to a pathway estimate.
          </li>
          <li>Add a hardware item and confirm the Project Total updates.</li>
        </ul>
      </Step>

      {/* Production build */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Optional: Production Build (single machine)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            For a more performant local install (no dev server, no hot reload):
          </p>
          <Block>{`# Build everything (typecheck + bundle)
pnpm run build

# Start the API server in production mode
NODE_ENV=production pnpm --filter @workspace/api-server run start

# Serve the built web app (any static server works)
pnpm --filter @workspace/cable-estimator exec vite preview --port 5173`}</Block>
          <p className="text-xs text-muted-foreground">
            For a true production deployment behind a domain, put both services
            behind a reverse proxy (Nginx, Caddy) so <Code>/api/*</Code> routes
            to the API server and everything else routes to the web app.
          </p>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Troubleshooting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-semibold">
              "DATABASE_URL is not set" or connection refused
            </p>
            <p className="text-muted-foreground">
              Make sure Postgres is running (<Code>pg_isready</Code>) and that{" "}
              <Code>.env</Code> is in the project root, not inside an artifact
              folder.
            </p>
          </div>
          <div>
            <p className="font-semibold">Port 8080 already in use</p>
            <p className="text-muted-foreground">
              Change <Code>PORT</Code> in <Code>.env</Code> to an open port
              (e.g. 3001) and restart the API server.
            </p>
          </div>
          <div>
            <p className="font-semibold">Schema validation errors after pull</p>
            <p className="text-muted-foreground">
              Re-run <Code>pnpm --filter @workspace/db run push</Code> after
              pulling new code, then restart the API server. Stored rate rows
              are auto-merged with new defaults on read.
            </p>
          </div>
          <div>
            <p className="font-semibold">Web app shows blank page</p>
            <p className="text-muted-foreground">
              Open browser devtools (F12) and check the Console + Network tabs.
              Most often the API server is not running, or{" "}
              <Code>VITE_API_URL</Code> is misconfigured.
            </p>
          </div>
          <div>
            <p className="font-semibold">PDF export shows empty page</p>
            <p className="text-muted-foreground">
              Open the estimate first so its data loads, then click{" "}
              <strong>Export PDF</strong>.
            </p>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center pt-4">
        Need help? See <Code>replit.md</Code> in the repo root for detailed
        architecture notes, or visit the <strong>Platform Guide</strong> tab.
      </p>
    </div>
  );
}
