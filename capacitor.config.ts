import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nexus.ai',
  appName: 'Nexus AI',
  webDir: 'dist'
  server: {
  	androidScheme: 'http',
  	hostname: 'localhost',
  	cleartext: true
  }
};

export default config;
