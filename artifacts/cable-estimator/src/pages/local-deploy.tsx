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
  RefreshCw,
  GitBranch,
  Monitor,
  Laptop,
  Apple,
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
        <p className="font-semibold">Install Git for your OS:</p>
        <div className="space-y-3">
          <div>
            <p className="flex items-center gap-2 font-medium">
              <Monitor className="w-4 h-4 text-primary" />
              Windows
            </p>
            <Block>{`# Option 1: use winget (Windows 11 / Windows 10 with App Installer)
winget install --id Git.Git -e --source winget

# Option 2: download the installer
# Go to https://git-scm.com/download/win and run the installer
# Leave the default options selected unless you know you need something different`}</Block>
          </div>
          <div>
            <p className="flex items-center gap-2 font-medium">
              <Apple className="w-4 h-4 text-primary" />
              macOS
            </p>
            <Block>{`# If you use Homebrew
brew install git

# Or install Apple's command line tools (includes Git)
xcode-select --install`}</Block>
          </div>
          <div>
            <p className="flex items-center gap-2 font-medium">
              <Laptop className="w-4 h-4 text-primary" />
              Linux
            </p>
            <Block>{`# Ubuntu / Debian
sudo apt update
sudo apt install git

# Fedora
sudo dnf install git

# Arch
sudo pacman -S git`}</Block>
          </div>
        </div>
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
        <Block>{`git clone https://github.com/richardakia/Estimator cable-estimator
cd cable-estimator
pnpm install`}</Block>
        <p className="text-xs text-muted-foreground">
          The first install pulls down all workspace packages and may take 1–2
          minutes.
        </p>
        <div className="space-y-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-muted-foreground">
          <p className="font-semibold text-amber-700 dark:text-amber-300">
            If pnpm install fails on Windows
          </p>
          <p>
            If you see <Code>'sh' is not recognized</Code> or{" "}
            <Code>Use pnpm instead</Code>, your local copy is older than the
            cross-platform fix. Pull the latest code and try again, or use the
            skip-scripts fallback:
          </p>
          <Block>{`git pull
pnpm install

# Fallback if it still fails:
pnpm install --ignore-scripts`}</Block>
        </div>
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
          Create a <Code>.env</Code> file in the project root. On Windows, open
          the folder in File Explorer, right-click inside the folder, choose{" "}
          <strong>Open in Terminal</strong>, then run <Code>notepad .env</Code>.
          If Notepad asks whether to create a new file, click <strong>Yes</strong>:
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
        <p className="text-xs text-muted-foreground">
          <strong>Windows tip:</strong> when saving in Notepad, set{" "}
          <Code>Save as type</Code> to <Code>All Files</Code> so the file is
          saved as <Code>.env</Code> and not <Code>.env.txt</Code>. The API
          server reads this file automatically on every start.
        </p>
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
        <div className="space-y-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          <p className="font-semibold text-amber-700 dark:text-amber-300">
            If push fails on Windows
          </p>
          <p className="text-muted-foreground">
            Some Windows setups need a full dependency refresh before the schema
            push will work. Try these steps in order:
          </p>
          <Block>{`# 1) Reinstall dependencies without scripts
pnpm install --ignore-scripts

# 2) If the esbuild binary is mismatched, install the Windows build that
#    matches the project version
pnpm add -D -w @esbuild/win32-x64@0.27.3

# 3) Try the schema push again
pnpm --filter @workspace/db run push`}</Block>
          <p className="text-xs text-muted-foreground">
            If you see <Code>sh is not recognized</Code>, run the commands in
            Git Bash or use <Code>pnpm install --ignore-scripts</Code> to skip
            the failing script.
          </p>
          <p className="text-xs text-muted-foreground">
            If you see <Code>DATABASE_URL, ensure the database is provisioned</Code>,
            set the variable in the same terminal before retrying:
          </p>
          <Block>{`# Command Prompt
set DATABASE_URL=postgres://estimator:changeme@localhost:5432/cable_estimator
pnpm --filter @workspace/db run push

# Git Bash
export DATABASE_URL=postgres://estimator:changeme@localhost:5432/cable_estimator
pnpm --filter @workspace/db run push`}</Block>
          <p className="text-xs text-muted-foreground">
            If you still get a permissions error for the public schema, run the
            push again after confirming the estimator user owns the database and
            has privileges on the <Code>public</Code> schema.
          </p>
        </div>
      </Step>

      <Step n={7} title="Start the API Server" icon={Server}>
        <p>In one terminal window:</p>
        <Block>{`pnpm --filter @workspace/api-server run dev`}</Block>
        <p>
          You should see{" "}
          <Code>Server listening port: 8080</Code> in the output. The server
          automatically loads <Code>DATABASE_URL</Code> and <Code>PORT</Code>
          {" "}from the <Code>.env</Code> file in the project root — you do not
          need to set them manually each time.
        </p>
        <div className="space-y-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          <p className="font-semibold text-amber-700 dark:text-amber-300">
            If the API server still complains about missing variables
          </p>
          <p className="text-muted-foreground">
            This means <Code>.env</Code> wasn't found in the project root.
            Confirm it lives next to <Code>package.json</Code> (not inside
            <Code> artifacts/api-server</Code>) and is named exactly{" "}
            <Code>.env</Code> — Notepad sometimes saves it as{" "}
            <Code>.env.txt</Code>. As a fallback, set the variables in the same
            terminal before running the dev script:
          </p>
          <Block>{`# Command Prompt (Windows)
set DATABASE_URL=postgres://estimator:changeme@localhost:5432/cable_estimator
set PORT=8080
pnpm --filter @workspace/api-server run dev

# Git Bash / macOS / Linux
export DATABASE_URL=postgres://estimator:changeme@localhost:5432/cable_estimator
export PORT=8080
pnpm --filter @workspace/api-server run dev`}</Block>
          <p className="text-xs text-muted-foreground">
            If you see <Code>'cross-env' is not recognized</Code>, run{" "}
            <Code>pnpm install</Code> from the project root once more — it
            installs the cross-platform helper used by the dev script.
          </p>
        </div>
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

      {/* Updating */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            Updating Your Local Copy After Replit Changes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-sm">
          <p>
            When new features, fixes, or rate changes are pushed to the Replit
            project, follow these steps on your local machine to pull and apply
            the updates safely. Always do this with the API server and web app
            <strong> stopped</strong> (press <Code>Ctrl+C</Code> in each
            terminal first).
          </p>

          <div>
            <p className="font-semibold flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-primary" />
              Step 1 — Back up your local data (optional but recommended)
            </p>
            <p className="text-muted-foreground mt-1">
              Your saved estimates live in your local Postgres database, not in
              the code. They are safe across updates, but a quick backup
              protects you if a schema change goes wrong:
            </p>
            <Block>{`pg_dump -U estimator -d cable_estimator > backup_$(date +%Y%m%d).sql`}</Block>
            <p className="text-xs text-muted-foreground">
              On Windows PowerShell, replace <Code>$(date +%Y%m%d)</Code> with
              today's date manually, e.g. <Code>backup_20260509.sql</Code>.
            </p>
          </div>

          <div>
            <p className="font-semibold flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-primary" />
              Step 2 — Open a terminal in your install folder
            </p>
            <Block>{`# cd into the same folder you cloned into originally
# Windows:
cd %USERPROFILE%\\Documents\\Apps\\cable-estimator

# macOS / Linux:
cd ~/Documents/Apps/cable-estimator`}</Block>
          </div>

          <div>
            <p className="font-semibold flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-primary" />
              Step 3 — Pull the latest code from Replit
            </p>
            <Block>{`# Save any local edits you may have made (rare):
git stash

# Pull the newest version from the repo Replit pushes to:
git pull

# (Optional) re-apply your stashed edits:
git stash pop`}</Block>
            <p className="text-xs text-muted-foreground">
              If <Code>git pull</Code> reports merge conflicts, it usually
              means you edited the same files locally. Run{" "}
              <Code>git status</Code> to see them and resolve, or run{" "}
              <Code>git reset --hard origin/main</Code> to discard your local
              edits and take the Replit version exactly (this only affects
              code, not your database).
            </p>
          </div>

          <div>
            <p className="font-semibold flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-primary" />
              Step 4 — Reinstall dependencies
            </p>
            <p className="text-muted-foreground mt-1">
              New features may add new packages. Always run this after a pull:
            </p>
            <Block>{`pnpm install`}</Block>
          </div>

          <div>
            <p className="font-semibold flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-primary" />
              Step 5 — Apply database schema changes
            </p>
            <p className="text-muted-foreground mt-1">
              If new tables or columns were added (the changelog or commit
              message will usually say so), push the updated schema. This is
              additive and will <strong>not</strong> erase your saved
              estimates:
            </p>
            <Block>{`pnpm --filter @workspace/db run push`}</Block>
            <p className="text-xs text-muted-foreground">
              When prompted about renames or destructive changes, read carefully
              before confirming. If unsure, choose "create new" instead of
              "rename" to keep old data.
            </p>
          </div>

          <div>
            <p className="font-semibold flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-primary" />
              Step 6 — Restart both services
            </p>
            <p className="text-muted-foreground mt-1">
              In one terminal:
            </p>
            <Block>{`pnpm --filter @workspace/api-server run dev`}</Block>
            <p className="text-muted-foreground">
              In a second terminal:
            </p>
            <Block>{`pnpm --filter @workspace/cable-estimator run dev`}</Block>
            <p className="text-xs text-muted-foreground">
              Open the app in your browser and do a hard refresh
              (<Code>Ctrl+Shift+R</Code> on Windows/Linux,{" "}
              <Code>Cmd+Shift+R</Code> on macOS) so the browser loads the new
              frontend bundle instead of a cached version.
            </p>
          </div>

          <div>
            <p className="font-semibold flex items-center gap-2">
              <Rocket className="w-4 h-4 text-primary" />
              Quick "all-in-one" update (when there are no schema changes)
            </p>
            <Block>{`git pull && pnpm install`}</Block>
            <p className="text-xs text-muted-foreground">
              Then restart both terminals. Use this shortcut only when you're
              confident the update is code-only (bug fixes, UI tweaks, rate
              tuning).
            </p>
          </div>

          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
            <p className="font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              If something breaks after an update
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-1">
              <li>
                Stop both services (<Code>Ctrl+C</Code>) and re-run{" "}
                <Code>pnpm install</Code> followed by{" "}
                <Code>pnpm --filter @workspace/db run push</Code>.
              </li>
              <li>
                Check the API terminal for red error text — most issues say
                exactly which table or column is missing.
              </li>
              <li>
                As a last resort, restore your database backup with{" "}
                <Code>psql -U estimator -d cable_estimator &lt; backup_YYYYMMDD.sql</Code>{" "}
                and roll the code back with{" "}
                <Code>git reset --hard HEAD~1</Code>.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

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
