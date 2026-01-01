const crypto = require('crypto');

// Générer un JWT secret aléatoire
const jwtSecret = crypto.randomBytes(32).toString('base64');

console.log('========================================');
console.log('CLÉS GÉNÉRÉES POUR SUPABASE');
console.log('========================================\n');

console.log('Copiez ces valeurs dans votre fichier .env sur Dokploy:\n');

console.log('JWT_SECRET=');
console.log(jwtSecret);
console.log('');

// Fonction simple pour créer un JWT (sans dépendance externe)
function createJWT(payload, secret) {
    const header = {
        alg: 'HS256',
        typ: 'JWT'
    };

    const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');

    const signature = crypto
        .createHmac('sha256', secret)
        .update(`${base64Header}.${base64Payload}`)
        .digest('base64url');

    return `${base64Header}.${base64Payload}.${signature}`;
}

// Générer Anon Key
const anonPayload = {
    role: 'anon',
    iss: 'supabase',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60) // 10 ans
};

const anonKey = createJWT(anonPayload, jwtSecret);

console.log('ANON_KEY=');
console.log(anonKey);
console.log('');

// Générer Service Role Key
const servicePayload = {
    role: 'service_role',
    iss: 'supabase',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60) // 10 ans
};

const serviceKey = createJWT(servicePayload, jwtSecret);

console.log('SERVICE_ROLE_KEY=');
console.log(serviceKey);
console.log('');

console.log('========================================');
console.log('⚠️  IMPORTANT: Sauvegardez ces clés en lieu sûr!');
console.log('========================================');
