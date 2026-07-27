import { _electron as electron } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync } from 'fs';
import { homedir } from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log('=== Ph1: Checking plugin state file...');
  
  // Look for state.json in common electron userData locations
  const home = homedir();
  const candidates = [
    path.join(home, '.config', 'sistema-facturacion', 'plugins', 'state.json'),
    path.join(home, '.config', 'sistema-facturacion-electron', 'plugins', 'state.json'),
  ];
  
  let stateContent = null;
  for (const f of candidates) {
    if (existsSync(f)) {
      stateContent = readFileSync(f, 'utf-8');
      console.log(`Found: ${f}`);
      console.log(`State: ${stateContent}`);
    }
  }
  if (!stateContent) console.log('No state.json found (plugin defaults to active)');
  
  console.log('\n=== Ph2: Launching Electron app...');
  const electronApp = await electron.launch({
    args: ['.'],
    executablePath: path.join(__dirname, 'node_modules', '.bin', 'electron'),
    cwd: __dirname,
  });

  console.log('Waiting for window...');
  const window = await electronApp.firstWindow();
  await window.waitForLoadState('networkidle');
  await new Promise(r => setTimeout(r, 4000));
  
  console.log('Window title:', await window.title());
  await window.screenshot({ path: '/tmp/app_pos.png' });
  
  // === IPC CALLS ===
  console.log('\n=== Ph3: IPC calls...');
  
  const pluginRes = await window.evaluate(async () => {
    const res = await window.electronAPI.getCountryPlugin();
    return res;
  });
  console.log('getCountryPlugin:', JSON.stringify(pluginRes, null, 2));
  
  const pluginsRes = await window.evaluate(async () => {
    const res = await window.electronAPI.listPlugins();
    return res;
  });
  console.log('\nlistPlugins:', JSON.stringify(pluginsRes, null, 2));
  
  // Login
  console.log('\n=== Ph4: Login...');
  const login = await window.evaluate(async () => {
    const res = await window.electronAPI.login({ username: 'admin', password: 'admin123' });
    return res;
  });
  console.log('Login success:', login.success);
  
  await new Promise(r => setTimeout(r, 3000));
  await window.screenshot({ path: '/tmp/app_logged.png' });
  
  // Check displayed text
  console.log('\n=== Ph5: UI content analysis...');
  const bodyText = await window.evaluate(() => document.body.innerText);
  
  console.log('---First 2000 chars of UI---');
  console.log(bodyText.substring(0, 2000));
  
  console.log('\n---Currency check---');
  const checks = ['Bs.', '$', 'RIF', 'Tax ID', 'Bs', 'SENIAT'];
  for (const c of checks) {
    const count = (bodyText.match(new RegExp(c.replace('.', '\\.'), 'g')) || []).length;
    if (count > 0) console.log(`Found "${c}" ${count} times`);
  }
  
  // Take a screenshot of the POS page
  console.log('\n=== Ph6: Navigate to POS...');
  
  // Look for POS link/button and click
  try {
    const posLink = await window.$('text=Punto de Venta');
    if (posLink) {
      await posLink.click();
      await new Promise(r => setTimeout(r, 2000));
      await window.screenshot({ path: '/tmp/app_pos_page.png' });
      const posText = await window.evaluate(() => document.body.innerText);
      console.log('POS page content (first 1000 chars):', posText.substring(0, 1000));
    }
  } catch (e) {
    console.log('Could not navigate to POS:', e.message);
  }
  
  await electronApp.close();
  console.log('\n=== DONE ===');
}

main().catch(err => {
  console.error('FATAL:', err?.stack || err);
  process.exit(1);
});
