
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger le fichier .env
dotenv.config({ path: path.resolve(__dirname, '.env') });

const { Client } = pg;

// Récupérer l'URL et ajuster pour SSL si nécessaire
let connectionString = process.env.DATABASE_URL || '';
// On force la désactivation SSL pour éviter les erreurs de certificat auto-signé ou manquant
if (!connectionString.includes('sslmode=')) {
    connectionString += (connectionString.includes('?') ? '&' : '?') + 'sslmode=disable';
}


async function run() {
    const maskedUrl = connectionString.replace(/:([^:@]+)@/, ':****@');
    console.log(`🔌 Connexion à : ${maskedUrl}`);

    const client = new Client({
        connectionString,
        connectionTimeoutMillis: 10000, // 10 secondes
    });

    try {
        await client.connect();
        console.log("✅ CONNEXION RÉUSSIE !");

        // 1. Lire les Subjects
        console.log("\n--- TABLE: Subject ---");
        const resSubjects = await client.query('SELECT * FROM "Subject" ORDER BY "createdAt" DESC LIMIT 50');
        if (resSubjects.rows.length === 0) {
            console.log("⚠️ Aucune matière trouvée.");
        } else {
            resSubjects.rows.forEach(row => {
                console.log(`[${row.id}] ${row.name} | Année: ${row.year} (${typeof row.year}) | Cat: ${row.category}`);
            });
        }

        // 2. Lire les Modules
        console.log("\n--- TABLE: Module ---");
        const resModules = await client.query('SELECT * FROM "Module" ORDER BY "createdAt" DESC LIMIT 50');
        if (resModules.rows.length === 0) {
            console.log("⚠️ Aucun module trouvé.");
        } else {
            resModules.rows.forEach(row => {
                console.log(`- ${row.name} (Parent: ${row.subjectId})`);
            });
        }

    } catch (err) {
        console.error("❌ ERREUR DE CONNEXION :", err.message);
        if (err.code) console.error("Code erreur:", err.code);
    } finally {
        await client.end();
    }
}

run();
