# Guide de Test - Module Education

## Test 1: Ajouter une Matière (Subject)
1. Aller dans Education > Cours
2. Cliquer sur "Ajouter une matière"
3. Entrer un nom (ex: "Anatomie")
4. Cliquer sur "Ajouter"

**Ce qui est envoyé au backend:**
```json
{
  "name": "Anatomie",
  "year": 1,
  "category": "cours"
}
```

## Test 2: Ajouter un Module
1. Sélectionner une matière
2. Cliquer sur "Ajouter un module"
3. Entrer un nom (ex: "Module 1")
4. Cliquer sur "Ajouter"

**Ce qui est envoyé au backend:**
```json
{
  "name": "Module 1",
  "subjectId": "uuid-de-la-matiere",
  "category": "cours"
}
```

## Test 3: Ajouter un Fichier
1. Sélectionner un module
2. Cliquer sur "Ajouter un fichier"
3. Sélectionner un fichier PDF
4. Cliquer sur "Ajouter"

**Processus:**
1. Upload du fichier vers `/api/storage/upload`
2. Création de l'enregistrement dans `/api/files`

## Erreurs Possibles

### Erreur: "Validation error"
- Vérifier que tous les champs requis sont remplis
- Vérifier que le `year` est un nombre
- Vérifier que les UUIDs sont valides

### Erreur: "Unauthorized" ou 401
- Vérifier que vous êtes connecté en tant qu'admin
- Vérifier que le token est valide

### Erreur: "Network error"
- Vérifier que l'API est démarrée
- Vérifier l'URL de l'API dans `.env`

## Commandes de Debug

### Vérifier les logs de l'API:
```bash
docker logs $(docker ps -qf name=amisrim-amisrimapi-wuxoni) --tail 100
```

### Tester l'API directement:
```bash
# Test de création de subject
curl -X POST https://api-amisrim.jadeoffice.cloud/api/subjects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"Test Subject","year":1,"category":"cours"}'
```
