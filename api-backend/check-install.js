#!/usr/bin/env node

/**
 * Script de vérification de l'installation
 * Vérifie que tous les prérequis sont en place
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const checks = [];
let hasErrors = false;

console.log('🔍 Vérification de l'installation AMIS RIM API...\n');

// Check Node.js version
try {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

    if (majorVersion >= 18) {
        checks.push({ name: 'Node.js version', status: '✅', detail: nodeVersion });
    } else {
        checks.push({ name: 'Node.js version', status: '❌', detail: `${nodeVersion} (requis: >= 18)` });
        hasErrors = true;
    }
} catch (error) {
    checks.push({ name: 'Node.js version', status: '❌', detail: 'Non détecté' });
    hasErrors = true;
}

// Check npm
try {
    const npmVersion = execSync('npm --version', { encoding: 'utf-8' }).trim();
    checks.push({ name: 'npm', status: '✅', detail: npmVersion });
} catch (error) {
    checks.push({ name: 'npm', status: '❌', detail: 'Non installé' });
    hasErrors = true;
}

// Check PostgreSQL
try {
    const pgVersion = execSync('psql --version', { encoding: 'utf-8' }).trim();
    checks.push({ name: 'PostgreSQL', status: '✅', detail: pgVersion });
} catch (error) {
    checks.push({ name: 'PostgreSQL', status: '⚠️', detail: 'Non détecté (peut être distant)' });
}

// Check .env file
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    checks.push({ name: 'Fichier .env', status: '✅', detail: 'Présent' });

    // Check .env content
    const envContent = fs.readFileSync(envPath, 'utf-8');

    const requiredVars = [
        'DATABASE_URL',
        'JWT_SECRET',
        'CORS_ORIGIN',
    ];

    const missingVars = requiredVars.filter(varName => !envContent.includes(varName));

    if (missingVars.length === 0) {
        checks.push({ name: 'Variables .env', status: '✅', detail: 'Toutes présentes' });
    } else {
        checks.push({ name: 'Variables .env', status: '❌', detail: `Manquantes: ${missingVars.join(', ')}` });
        hasErrors = true;
    }

    // Check if JWT_SECRET is changed
    if (envContent.includes('your-super-secret-jwt-key-change-this-in-production')) {
        checks.push({ name: 'JWT_SECRET', status: '⚠️', detail: 'Valeur par défaut (à changer!)' });
    } else {
        checks.push({ name: 'JWT_SECRET', status: '✅', detail: 'Personnalisé' });
    }
} else {
    checks.push({ name: 'Fichier .env', status: '❌', detail: 'Absent (copiez .env.example)' });
    hasErrors = true;
}

// Check node_modules
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
    checks.push({ name: 'node_modules', status: '✅', detail: 'Installé' });
} else {
    checks.push({ name: 'node_modules', status: '❌', detail: 'Absent (exécutez: npm install)' });
    hasErrors = true;
}

// Check Prisma Client
const prismaClientPath = path.join(__dirname, 'node_modules', '.prisma', 'client');
if (fs.existsSync(prismaClientPath)) {
    checks.push({ name: 'Prisma Client', status: '✅', detail: 'Généré' });
} else {
    checks.push({ name: 'Prisma Client', status: '⚠️', detail: 'Non généré (exécutez: npm run prisma:generate)' });
}

// Check uploads directory
const uploadsPath = path.join(__dirname, 'uploads');
if (fs.existsSync(uploadsPath)) {
    checks.push({ name: 'Dossier uploads', status: '✅', detail: 'Présent' });
} else {
    checks.push({ name: 'Dossier uploads', status: '⚠️', detail: 'Absent (sera créé automatiquement)' });
}

// Check dist directory (if built)
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
    checks.push({ name: 'Build production', status: '✅', detail: 'Compilé' });
} else {
    checks.push({ name: 'Build production', status: 'ℹ️', detail: 'Non compilé (normal en dev)' });
}

// Display results
console.log('┌─────────────────────────────────────────────────────────────┐');
console.log('│                    Résultats de Vérification                │');
console.log('├─────────────────────────────────────────────────────────────┤');

checks.forEach(check => {
    const name = check.name.padEnd(25);
    const status = check.status.padEnd(5);
    const detail = check.detail;
    console.log(`│ ${name} ${status} ${detail.padEnd(25)} │`);
});

console.log('└─────────────────────────────────────────────────────────────┘\n');

// Summary
if (hasErrors) {
    console.log('❌ Certaines vérifications ont échoué. Veuillez corriger les erreurs ci-dessus.\n');
    console.log('📚 Consultez QUICK_START.md pour les instructions d\'installation.\n');
    process.exit(1);
} else {
    console.log('✅ Toutes les vérifications essentielles sont passées!\n');
    console.log('🚀 Prochaines étapes:');
    console.log('   1. Vérifiez votre connexion à la base de données');
    console.log('   2. Exécutez: npm run setup (pour initialiser la DB)');
    console.log('   3. Exécutez: npm run dev (pour démarrer le serveur)\n');
    console.log('📚 Documentation: README.md, QUICK_START.md, ARCHITECTURE.md\n');
}
