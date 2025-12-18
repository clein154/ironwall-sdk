# IronWall SDK

The official client-side SDK for the [IronWall Protocol](https://ironwall-protocol.xyz).

IronWall is a **Proof-of-Work (PoW)** rate-limiting protocol designed to protect high-value API endpoints (AI generation, Auth, SMS triggers) from automated abuse.

Instead of challenging the user's humanity (CAPTCHA), IronWall challenges the device's computational capacity. It forces clients to solve a cryptographic puzzle (Argon2) before their request is accepted by the backend.

---

## 🛡️ Security & Privacy Promise

*   **NOT A CRYPTO MINER:** This library calculates a single hash for authentication purposes only. It runs for approximately 1-2 seconds and then stops.
*   **Zero Tracking:** No cookies, no fingerprinting, no data collection.
*   **Open Source:** This repository is open for audit to ensure compliance and safety.

---

## 📦 Installation

### Option A: NPM (Recommended)
Perfect for React, Next.js, Vue, and modern stacks.

```bash
npm install ironwall-sdk
Option B: CDN

Perfect for Vanilla HTML/JS projects.

<script src="https://ironwall-backend.vercel.app/dist/ironwall.min.js"></script>
🚀 Usage
1. Configuration

Initialize the SDK once in your application's entry point (e.g., App.tsx or layout.js).

import { IronWall } from 'ironwall-sdk';

IronWall.configure({
  apiKey: 'iw_live_YOUR_PUBLIC_KEY', // Get this from the Dashboard
  debug: false // Set to true to see logs in console
});
2. Guarding an Action

Call guard() before performing a sensitive action. This function is asynchronous and will pause execution until the puzzle is solved.

const handleLogin = async () => {
  try {
    // 1. Pause execution until Proof-of-Work is complete (~1-2s)
    const passport = await IronWall.guard();
    
    // 2. IronWall Proxy automatically validates the request at the edge.
    // If you are using your own backend, send the passport in headers:
    // headers: { 'x-ironwall-passport': passport }
    
    await api.post('/login', { username, password });
    
  } catch (error) {
    // Handle rejection (e.g., User closed tab, or Bot detected)
    console.error("Access Denied", error);
  }
};

🧩 Error Handling

Error Code	Description	Mitigation
IRONWALL_BLOCK	Request blocked by security policy (Geo-Fencing or IP Reputation).	Check Dashboard Settings.
PAYMENT_REQUIRED	Monthly request quota exceeded.	Upgrade plan in Billing.
401_UNAUTHORIZED	Invalid or missing API Key.	Verify IronWall.configure() key.
TIMEOUT	Puzzle took too long (>60s).	Client device under heavy load.
📄 License

MIT.
