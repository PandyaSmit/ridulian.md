# ridulian.md

> A modern, MDX-driven lore and world-building engine designed for authors, game masters, and franchise architects.

**ridulian.md** is a robust web application built to streamline the complex process of universe design. It features a bespoke "Imperial Archive" interface—obsidian backgrounds, parchment text, and tarnished gold accents—wrapped around a powerful dual-pane Monaco editor with real-time MDX compilation. At its core, it enables infinite, dynamic folder nesting powered by a custom Virtual File System (VFS).

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![React](https://img.shields.io/badge/React-18-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC)
![AWS S3](https://img.shields.io/badge/AWS-S3-FF9900)
![Auth.js](https://img.shields.io/badge/Auth.js-Security-green)

---

## 🌟 High-Level Features

* **Infinite Folder Nesting via VFS:** A sophisticated Virtual File System allows you to organize your lore entries, characters, and timelines without depth restrictions.
* **Dual-Mode Storage Adapter:** Seamlessly swap the backend storage engine between your local hard drive (`content/`) and the cloud (AWS S3) without changing a single line of frontend code.
* **Bespoke "Imperial Archive" Interface:** An immersive, distraction-free environment utilizing `framer-motion` for smooth, thematic UI transitions.
* **Live MDX Compilation:** instantly preview your markdown, interactive timelines, and dynamically rendered react components side-by-side with your code.
* **Secure by Default:** Integrates `next-auth` to strictly control read/write access and namespace user projects.

---

## 🏗 Architecture & Storage Adapter

ridulian.md operates on an **"Open-Core"** architecture, allowing both local deployment for hobbyists and infinitely scalable Cloud SaaS deployment models.

This flexibility is achieved via the **Storage Adapter Pattern** implemented inside `src/lib/StorageManager.ts`. 

The StorageManager acts as a universal middleman. The frontend always assumes it is communicating with a standardized, flat array of `VFSNode` objects. The Adapter translates these standard VFS operations (CRUD) dynamically based on your chosen `STORAGE_MODE`:

* **`LOCAL` Mode:** 
  The app acts as a traditional Node.js server. The adapter leverages native `fs.promises` to read and write physical directories and `.mdx` files directly to the `content/` folder mapped to your hard drive. Folder structures are scanned recursively and mapped to VFS logic in real-time.
* **`CLOUD` Mode:**
  The app acts as a multi-tenant SaaS. The adapter relies on `@aws-sdk/client-s3` to push and pull data from an AWS S3 Bucket. Because S3 is flat storage, the adapter maintains an active `project-index.json` file per project to virtually map out the nested folder hierarchies.

---

## 📂 Folder Structure

```text
ridulian.md/
├── content/                     # LOCAL Storage Mode root directory
│   └── [projectId]/             # Physical workspace for active projects
├── src/
│   ├── app/                     # Next.js App Router root
│   │   ├── api/                 # NextAuth, VFS Tree APIs, and Document handlers
│   │   ├── dashboard/           # "The Grand Codex" UI
│   │   └── editor/[projectId]/  # Split-pane workspace editor logic
│   ├── components/
│   │   ├── EditorWorkspace.tsx  # Recursive VFS Sidebar & Monaco mounting
│   │   ├── ProjectList.tsx      # Archive creation and deletion modals
│   │   └── TopNav.tsx           # Application routing and authentication states
│   └── lib/
│       ├── StorageManager.ts    # The Core Dual-Mode Storage Adapter
│       └── auth.ts              # NextAuth / Auth.js security boundaries
├── .env.local                   # Environment configurations & secrets
├── projects.json                # Local-mode project registry payload
└── package.json
```

---

## 🚀 Quick Start (Local Open-Source Mode)

For users who want to run the engine locally entirely free of charge, saving their writing directly to their own hard drive.

**1. Clone the repository and install dependencies:**
```bash
git clone https://github.com/your-username/ridulian.md.git
cd ridulian.md
npm install
```

**2. Configure your Environment Variables:**
Duplicate `sample.env` and rename it to `.env.local`. Set the storage mode and GitHub Auth variables:
```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate_a_random_32_character_string"

# Use your GitHub OAuth App credentials
GITHUB_ID="your_github_client_id"
GITHUB_SECRET="your_github_client_secret"

# Enforce Local OS Storage
STORAGE_MODE="LOCAL"
```

**3. Run the Development Server:**
```bash
npm run dev
```
Navigate to `http://localhost:3000` to present your credentials to the Imperial Archive.

---

## ☁ Self-Hosting (Cloud SaaS Mode)

For power users constructing a scalable, multi-tenant application via Vercel and AWS infrastructure.

**1. Prepare AWS S3:**
Ensure you have provisioned an S3 bucket with adequate read/write permissions for your programmatic IAM user.

**2. Deploy to Vercel:**
Connect your GitHub repository to Vercel. Ensure your Next.js build command is standard (`npm run build`).

**3. Configure Production Environment Variables:**
Inject the following environment variables securely into your Vercel project settings:

```env
# Standard Auth
NEXTAUTH_URL="https://your-production-domain.com"
NEXTAUTH_SECRET="..."
GITHUB_ID="..."
GITHUB_SECRET="..."

# Enforce SaaS Cloud Mode
STORAGE_MODE="CLOUD"

# AWS Configuration
AWS_REGION="us-east-1"
S3_BUCKET_NAME="..."
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
```

The application will now automatically generate index files and seamlessly pipe all Markdown strings directly into the AWS S3 Bucket upon save, bypassing the ephemeral Vercel filesystem layer entirely.
