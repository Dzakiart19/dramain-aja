import { execSync } from 'child_process';

try {
  console.log('🔧 Building...');
  execSync('vite build', { stdio: 'inherit' });
  
  console.log('🚀 Deploying to Firebase...');
  // Note: This requires FIREBASE_TOKEN to be set in the environment
  execSync('firebase deploy --project dramain-aja', { 
    stdio: 'inherit',
    env: process.env
  });
  
  console.log('✅ Deployed to: https://dramain-aja.web.app');
} catch (error) {
  console.error('❌ Deploy failed:', error);
  process.exit(1);
}
