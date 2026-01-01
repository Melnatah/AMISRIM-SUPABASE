// Test de connexion à la nouvelle instance Supabase JadeOffice
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://supabase.jadeoffice.cloud';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIn0.9u8ayd2jUQt7R6G6cUl2YZLWwFoW2F26zTfRCDt3ewU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
    console.log('🔄 Test de connexion à Supabase JadeOffice...\n');

    try {
        // Test 1: Vérifier les tables
        console.log('📋 Test 1: Vérification des tables...');
        const { data: tables, error: tablesError } = await supabase
            .from('profiles')
            .select('count')
            .limit(1);

        if (tablesError) {
            console.error('❌ Erreur tables:', tablesError.message);
        } else {
            console.log('✅ Table profiles accessible');
        }

        // Test 2: Lister toutes les tables accessibles
        console.log('\n📊 Test 2: Liste des tables...');
        const tablesToCheck = [
            'profiles', 'sites', 'modules', 'subjects', 'files',
            'contributions', 'messages', 'settings', 'leisure_events',
            'leisure_contributions', 'leisure_participants', 'attendance'
        ];

        for (const table of tablesToCheck) {
            const { error } = await supabase.from(table).select('count').limit(1);
            if (error) {
                console.log(`❌ ${table}: ${error.message}`);
            } else {
                console.log(`✅ ${table}: OK`);
            }
        }

        console.log('\n✅ Test de connexion terminé avec succès!');

    } catch (error) {
        console.error('❌ Erreur générale:', error);
    }
}

testConnection();
