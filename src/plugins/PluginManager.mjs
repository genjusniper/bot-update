// src/plugins/PluginManager.mjs
// V8 — Dynamic Plugin SDK and Manifest Validator
import fs from 'fs';
import path from 'path';

export class PluginManager {
  constructor(pluginDir = 'plugins') {
    this.pluginDir = path.resolve(pluginDir);
    this.plugins = new Map();
    if (!fs.existsSync(this.pluginDir)) {
      fs.mkdirSync(this.pluginDir, { recursive: true });
    }
  }

  async loadPlugins() {
    console.log('🔌 [PluginManager] Loading plugins from:', this.pluginDir);
    const entries = fs.readdirSync(this.pluginDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      
      const folderPath = path.join(this.pluginDir, entry.name);
      const manifestPath = path.join(folderPath, 'manifest.json');
      
      if (!fs.existsSync(manifestPath)) {
        console.warn(`⚠️ [PluginManager] Skipping folder ${entry.name}: manifest.json not found.`);
        continue;
      }
      
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        this.validateManifest(entry.name, manifest);
        
        const entrypointPath = path.join(folderPath, manifest.entrypoint);
        const module = await import(path.toNamespacedPath ? path.toNamespacedPath(entrypointPath) : 'file://' + entrypointPath);
        
        this.plugins.set(manifest.name, {
          manifest,
          module: module.default || module
        });
        
        console.log(`✅ [PluginManager] Plugin loaded successfully: ${manifest.name} (v${manifest.version || '1.0.0'})`);
      } catch(e) {
        console.error(`❌ [PluginManager] Failed to load plugin in ${entry.name}:`, e.message);
      }
    }
  }

  validateManifest(folderName, manifest) {
    const required = ['name', 'entrypoint', 'capabilities'];
    for (const field of required) {
      if (!manifest[field]) {
        throw new Error(`Manifest validation failed in folder "${folderName}": Missing required field "${field}"`);
      }
    }
    if (!Array.isArray(manifest.capabilities)) {
      throw new Error(`Manifest validation failed in folder "${folderName}": "capabilities" must be an array`);
    }
  }

  getPlugin(name) {
    return this.plugins.get(name);
  }

  listPlugins() {
    return Array.from(this.plugins.values()).map(p => p.manifest);
  }
}
