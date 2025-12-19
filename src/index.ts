// Define global types for the window object
declare global {
  interface Window {
    hashwasm: any;
    IronWall: any;
  }
}

// 1. Define the Strict Contract (The Interface)
export interface IronWallConfig {
  apiKey: string;
  apiUrl?: string;
  debug?: boolean;
}

export interface IronWallDifficulty {
  memoryCost: number;
  timeCost: number;
  parallelism: number;
}

export interface IronWallChallenge {
  passportId: string;
  salt: string;
  difficulty: IronWallDifficulty;
}

export class IronWall {
  private static apiKey: string;
  private static apiUrl: string = 'https://ironwall-backend.vercel.app/api/v1/ironwall';
  private static debug: boolean = false;
  private static initialized: boolean = false;

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

  static async guard(): Promise<string> {
    if (!this.initialized) throw new Error('IronWall not configured. Call IronWall.configure(key) first.');

    this.log('🛡️ Starting Handshake...');
    
    await this.waitForLib();

    try {
      // 2. Use Strict Type here
      const challenge: IronWallChallenge = await this.fetchChallenge();
      this.log('Received Challenge', challenge);

      const solution = await this.solvePuzzle(challenge);
      this.log('Puzzle Solved', 'Sending Proof...');

      const result = await this.verifySolution(challenge.passportId, solution);
      this.log('✅ Access Granted');
      
      return result.passport;

    } catch (error: any) {
      console.error('[IronWall] Blocked:', error.message);
      throw error;
    }
  }

  // --- INTERNAL UTILITIES ---

  private static log(...args: any[]) {
    if (this.debug) console.log('[IronWall]', ...args);
  }

  private static loadDependency() {
    if (typeof window === 'undefined') return;
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
        if (attempts > 100) {
            clearInterval(interval);
            console.error("IronWall: Failed to load cryptographic engine.");
        }
      }, 100);
    });
  }

  // 3. Return Type defined
  private static async fetchChallenge(): Promise<IronWallChallenge> {
    const res = await fetch(`${this.apiUrl}/challenge`, {
      headers: { 'x-api-key': this.apiKey }
    });
    if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
    const json = await res.json();
    return json.data as IronWallChallenge;
  }

  //  4. Argument Type defined (No more 'any')
  private static async solvePuzzle(challenge: IronWallChallenge): Promise<string> {
    const { salt, difficulty } = challenge;
    
    // Safety check for runtime data integrity
    if (!difficulty || !difficulty.memoryCost) {
        throw new Error("Invalid Challenge Contract");
    }

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