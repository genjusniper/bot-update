
      (async () => {
        try {
          const pbMod = await import('./src/agent/background/ProactiveBrain.mjs');
          const pb = new pbMod.ProactiveBrain();
          console.log('✅ ProactiveBrain loaded successfully.');
        } catch (err) {
          console.log('❌ ProactiveBrain gagal dimuat:', err);
        }
      })();
    
