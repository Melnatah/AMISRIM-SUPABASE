
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env explicitly
dotenv.config({ path: path.resolve(__dirname, '.env') });

let url = process.env.DATABASE_URL || '';
if (url && !url.includes('sslmode=')) {
    url += '&sslmode=disable&connect_timeout=10';
}

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: url
        },
    },
});

async function main() {
    const maskedUrl = url.replace(/:([^:@]+)@/, ':****@');
    console.log(`🔍 Tentative de connexion à: ${maskedUrl}`);


    if (!url) {
        console.error('❌ ERREUR: DATABASE_URL est vide !');
        return;
    }

    console.log('⏳ Connexion en cours...');
    try {
        // Force connection explicitly
        await prisma.$connect();
        console.log('✅ Connexion Prisma établie !');

        // Check tables
        const subjects = await prisma.subject.findMany();
        console.log(`📚 ${subjects.length} matières trouvées.`);

        subjects.forEach(s => {
            console.log(`- [${s.id}] "${s.name}" (Année: ${s.year}, Cat: ${s.category})`);
        });

        const modules = await prisma.module.findMany();
        console.log(`\n📦 ${modules.length} modules trouvés.`);
        modules.forEach(m => {
            console.log(`- "${m.name}" (SujetID: ${m.subjectId})`);
        });

    } catch (e: any) {
        console.error('❌ ECHEC DE CONNEXION');
        console.error('Message:', e.message);
        if (e.code) console.error('Code:', e.code);
        if (e.clientVersion) console.error('Prisma Version:', e.clientVersion);
    } finally {
        await prisma.$disconnect();
    }
}

main();
