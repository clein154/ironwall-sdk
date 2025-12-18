import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm', 'iife'], // CommonJS, ES Modules, and Browser Script
  dts: true, // Generate Type Definitions
  splitting: false,
  sourcemap: true,
  clean: true,
  //globalName: 'IronWall', // <script> window.IronWall
  minify: true, // Make it tiny
});