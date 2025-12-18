// Define global types for the window object to avoid TS errors
declare global {
  interface Window {
    hashwasm: any;
  }
}

interface IronWallConfig {
  apiKey: string;
  apiUrl?: string;
  debug?: boolean;
}

export class IronWall {
  private static apiKey: string;
  private static apiUrl: string = 'https://ironwall-backend.vercel.app/api/v1/ironwall';
  private static debug: boolean = false;
  private static initialized: boolean = false;

  /**
   * Initialize the IronWall SDK
   * @param config Configuration object
   */
  static configure(config: string | IronWallConfig) {
    if (typeof config === 'string') {
      this.apiKey = config;
    } else {
      this.apiKey = config.apiKey;
      if (config.apiUrl) this.apiUrl = config.apiUrl;
      if (config.debug) this.debug = config.debug;
    }

    this.log('Configuration Loaded');
    this.loadDependency();
    this.initialized = true;
  }

  /**
   * The Main Guard Function.
   * Call this before sensitive actions (Login, Register, AI generation).
   */
  static async guard(): Promise<string> {
    if (!this.initialized) throw new Error('IronWall not configured. Call IronWall.configure(key) first.');

    this.log('🛡️ Starting Handshake...');
    
    // 1. Ensure Dependencies are ready
    await this.waitForLib();

    try {
      // 2. Request Challenge
      const challenge = await this.fetchChallenge();
      this.log('Received Challenge', challenge);

      // 3. Solve (Proof of Work)
      const solution = await this.solvePuzzle(challenge);
      this.log('Puzzle Solved', 'Sending Proof...');

      // 4. Verify
      const result = await this.verifySolution(challenge.passportId, solution);
      this.log('✅ Access Granted');
      
      return result.passport; // Return the passport/token

    } catch (error: any) {
      console.error('[IronWall] Blocked:', error.message);
      throw error;
    }
  }

  // --- INTERNAL UTILITIES ---

  private static log(...args: any[]) {
    if (this.debug) console.log('[IronWall]', ...args);
  }

  // Lazy Load the Argon2 WASM library (Keeps our SDK tiny)
  private static loadDependency() {
    if (typeof window === 'undefined') return; // Server-side safety
    if (document.getElementById('ironwall-wasm-lib')) return;
    
    const script = document.createElement('script');
    script.id = 'ironwall-wasm-lib';
    script.src = 'https://cdn.jsdelivr.net/npm/hash-wasm@4/dist/argon2.umd.min.js';
    script.async = true;
    document.head.appendChild(script);
  }

  private static waitForLib(): Promise<void> {
    return new Promise((resolve) => {
      if (window.hashwasm) return resolve();
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (window.hashwasm) {
          clearInterval(interval);
          resolve();
        }
        if (attempts > 100) { // 10 seconds timeout
            clearInterval(interval);
            console.error("IronWall: Failed to load cryptographic engine.");
        }
      }, 100);
    });
  }

  private static async fetchChallenge() {
    const res = await fetch(`${this.apiUrl}/challenge`, {
      headers: { 'x-api-key': this.apiKey }
    });
    if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
    const json = await res.json();
    return json.data;
  }

  private static async solvePuzzle(challenge: any) {
    const { salt, difficulty } = challenge;
    // Uses the externally loaded hash-wasm library
    return await window.hashwasm.argon2id({
      password: salt,
      salt: salt,
      parallelism: difficulty.parallelism,
      memorySize: difficulty.memoryCost,
      iterations: difficulty.timeCost,
      hashLength: 32,
      outputType: 'encoded'
    });
  }

  private static async verifySolution(passportId: string, solution: string) {
    const res = await fetch(`${this.apiUrl}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey
      },
      body: JSON.stringify({ passportId, solution })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Verification Failed');
    return json;
  }
}

if (typeof window !== 'undefined') {
  // @ts-ignore
  window.IronWall = IronWall; 
}

export default IronWall;