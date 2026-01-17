#!/usr/bin/env node

/**
 * 🔒 Script de Verificación de Seguridad
 * 
 * Verifica que la aplicación esté correctamente configurada
 * y que las API keys de Airtable NO estén expuestas al cliente.
 */

const fs = require('fs');
const path = require('path');

// Colores para la terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.blue}=== ${msg} ===${colors.reset}\n`),
};

let errorCount = 0;
let warningCount = 0;

/**
 * Verifica que exista .env.local
 */
function checkEnvLocal() {
  log.section('Verificando archivo .env.local');
  
  const envPath = path.join(__dirname, '.env.local');
  
  if (fs.existsSync(envPath)) {
    log.success('.env.local existe');
    
    // Leer y verificar variables
    const content = fs.readFileSync(envPath, 'utf8');
    
    const requiredVars = [
      'AIRTABLE_TOKEN',
      'AIRTABLE_BASE_ID',
    ];
    
    requiredVars.forEach(varName => {
      if (content.includes(`${varName}=`)) {
        const match = content.match(new RegExp(`${varName}=(.+)`));
        if (match && match[1].trim() && !match[1].includes('your_') && !match[1].includes('tu_')) {
          log.success(`${varName} está configurado`);
        } else {
          log.warning(`${varName} existe pero parece ser un placeholder`);
          warningCount++;
        }
      } else {
        log.error(`${varName} NO está definido`);
        errorCount++;
      }
    });
    
  } else {
    log.error('.env.local NO existe');
    log.info('Crea el archivo copiando: cp .env.example .env.local');
    errorCount++;
  }
}

/**
 * Verifica que .env.local esté en .gitignore
 */
function checkGitignore() {
  log.section('Verificando .gitignore');
  
  const gitignorePath = path.join(__dirname, '.gitignore');
  
  if (fs.existsSync(gitignorePath)) {
    const content = fs.readFileSync(gitignorePath, 'utf8');
    
    if (content.includes('.env') || content.includes('.env*.local')) {
      log.success('.env.local está protegido en .gitignore');
    } else {
      log.error('.env.local NO está en .gitignore');
      log.info('Añade ".env*.local" a tu .gitignore');
      errorCount++;
    }
  } else {
    log.warning('.gitignore no existe');
    warningCount++;
  }
}

/**
 * Busca API keys hardcodeadas en el código
 */
function checkHardcodedKeys() {
  log.section('Buscando API keys hardcodeadas');
  
  const dangerousPatterns = [
    /pat[A-Za-z0-9]{30,}/g,  // Airtable personal access tokens
    /Bearer\s+pat[A-Za-z0-9]+/g,
  ];
  
  const filesToCheck = [
    'components',
    'app',
    'lib',
  ];
  
  let foundIssues = false;
  
  function scanDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        dangerousPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            log.error(`Posible API key hardcodeada en: ${fullPath}`);
            log.info(`  Patrón encontrado: ${matches[0].substring(0, 20)}...`);
            foundIssues = true;
            errorCount++;
          }
        });
      }
    });
  }
  
  filesToCheck.forEach(dir => scanDirectory(dir));
  
  if (!foundIssues) {
    log.success('No se encontraron API keys hardcodeadas');
  }
}

/**
 * Verifica que NO haya variables NEXT_PUBLIC_AIRTABLE_*
 */
function checkPublicEnvVars() {
  log.section('Verificando variables NEXT_PUBLIC_');
  
  const filesToCheck = ['.env.local', '.env.example', '.env'];
  let foundDangerousVars = false;
  
  filesToCheck.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      if (content.match(/NEXT_PUBLIC_AIRTABLE/)) {
        log.error(`Encontrado NEXT_PUBLIC_AIRTABLE_* en ${file}`);
        log.info('NUNCA uses NEXT_PUBLIC_ con API keys de Airtable');
        foundDangerousVars = true;
        errorCount++;
      }
    }
  });
  
  if (!foundDangerousVars) {
    log.success('No hay variables NEXT_PUBLIC_AIRTABLE_* (correcto)');
  }
}

/**
 * Verifica que las llamadas a Airtable sean solo desde el servidor
 */
function checkAirtableCalls() {
  log.section('Verificando llamadas a Airtable API');
  
  const componentsDir = path.join(__dirname, 'components');
  const appDir = path.join(__dirname, 'app');
  
  let foundDirectCalls = false;
  
  function scanForDirectCalls(dir, dirName) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && file !== 'api') {
        scanForDirectCalls(fullPath, dirName);
      } else if (file.match(/\.(tsx|jsx)$/) && !fullPath.includes('/api/')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        if (content.includes('api.airtable.com')) {
          log.error(`Llamada directa a Airtable en: ${fullPath}`);
          log.info('Las llamadas a Airtable deben hacerse desde /api/* routes');
          foundDirectCalls = true;
          errorCount++;
        }
      }
    });
  }
  
  scanForDirectCalls(componentsDir, 'components');
  scanForDirectCalls(appDir, 'app');
  
  if (!foundDirectCalls) {
    log.success('No hay llamadas directas a Airtable desde el cliente');
  }
}

/**
 * Verifica que exista middleware de seguridad
 */
function checkMiddleware() {
  log.section('Verificando middleware de seguridad');
  
  const middlewarePath = path.join(__dirname, 'middleware.ts');
  
  if (fs.existsSync(middlewarePath)) {
    log.success('middleware.ts existe');
    
    const content = fs.readFileSync(middlewarePath, 'utf8');
    
    if (content.includes('AIRTABLE_TOKEN')) {
      log.success('Middleware verifica variables de entorno');
    } else {
      log.warning('Middleware existe pero no verifica AIRTABLE_TOKEN');
      warningCount++;
    }
  } else {
    log.warning('middleware.ts no existe (recomendado añadirlo)');
    warningCount++;
  }
}

/**
 * Resumen final
 */
function printSummary() {
  log.section('Resumen de Seguridad');
  
  if (errorCount === 0 && warningCount === 0) {
    console.log(`${colors.green}
╔═══════════════════════════════════════════╗
║  🎉 ¡TODO ESTÁ CONFIGURADO CORRECTAMENTE! ║
║                                           ║
║  Tu aplicación es SEGURA. Las API keys    ║
║  de Airtable NO están expuestas.          ║
╚═══════════════════════════════════════════╝
${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}Resumen:${colors.reset}`);
    
    if (errorCount > 0) {
      log.error(`${errorCount} error(es) encontrado(s) - REQUIERE ACCIÓN`);
    }
    
    if (warningCount > 0) {
      log.warning(`${warningCount} advertencia(s) - Revisar recomendaciones`);
    }
    
    console.log(`\n${colors.cyan}Lee SEGURIDAD.md para más información${colors.reset}\n`);
    
    if (errorCount > 0) {
      process.exit(1);
    }
  }
}

// Ejecutar todas las verificaciones
console.log(`${colors.blue}
╔════════════════════════════════════════╗
║  🔒 Verificador de Seguridad API      ║
║     Airtable & Next.js                ║
╚════════════════════════════════════════╝
${colors.reset}`);

checkEnvLocal();
checkGitignore();
checkPublicEnvVars();
checkHardcodedKeys();
checkAirtableCalls();
checkMiddleware();
printSummary();

