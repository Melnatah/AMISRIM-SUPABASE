
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || typeof q !== 'string' || q.length < 2) {
            return res.json([]);
        }

        const query = q.toLowerCase();

        // Perform parallel searches
        const [users, sites, modules, files] = await Promise.all([
            // 1. Users
            prisma.profile.findMany({
                where: {
                    OR: [
                        { firstName: { contains: query, mode: 'insensitive' } },
                        { lastName: { contains: query, mode: 'insensitive' } }
                    ]
                },
                take: 5,
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    role: true
                }
            }),

            // 2. Sites
            prisma.site.findMany({
                where: { name: { contains: query, mode: 'insensitive' } },
                take: 3,
                select: { id: true, name: true, type: true }
            }),

            // 3. Modules (Courses)
            prisma.module.findMany({
                where: { name: { contains: query, mode: 'insensitive' } },
                take: 5,
                select: {
                    id: true,
                    name: true,
                    category: true,
                    subject: { select: { name: true } }
                }
            }),

            // 4. Files
            prisma.file.findMany({
                where: { name: { contains: query, mode: 'insensitive' } },
                take: 5,
                select: {
                    id: true,
                    name: true,
                    type: true,
                    url: true,
                    moduleId: true
                }
            })
        ]);

        // Format combined results
        const results = [
            ...users.map(u => ({
                type: 'user',
                id: u.id,
                title: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
                subtitle: u.role === 'admin' ? 'Administrateur' : 'Résident',
                avatar: u.avatar,
                icon: 'person'
            })),
            ...sites.map(s => ({
                type: 'site',
                id: s.id,
                title: s.name,
                subtitle: s.type || 'Site de stage',
                icon: 'location_on'
            })),
            ...modules.map(m => ({
                type: 'module',
                id: m.id,
                title: m.name,
                subtitle: `Cours - ${m.subject?.name || 'Général'}`,
                icon: 'school'
            })),
            ...files.map(f => ({
                type: 'file',
                id: f.id,
                title: f.name,
                subtitle: 'Fichier',
                url: f.url,
                moduleId: f.moduleId,
                icon: 'description'
            }))
        ];

        res.json(results);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: 'Search failed' });
    }
});

export default router;
