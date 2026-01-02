import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Create admin user
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@amisrim.tg';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail },
    });

    if (existingAdmin) {
        console.log('✅ Admin user already exists');
    } else {
        const passwordHash = await bcrypt.hash(adminPassword, 10);

        const admin = await prisma.user.create({
            data: {
                email: adminEmail,
                passwordHash,
                profile: {
                    create: {
                        firstName: 'Admin',
                        lastName: 'AMIS RIM',
                        email: adminEmail,
                        role: 'admin',
                        status: 'approved',
                    },
                },
            },
            include: { profile: true },
        });

        console.log('✅ Admin user created:');
        console.log(`   Email: ${adminEmail}`);
        console.log(`   Password: ${adminPassword}`);
        console.log(`   ⚠️  CHANGE THIS PASSWORD IN PRODUCTION!`);
    }

    // Create some default settings
    const defaultSettings = [
        { key: 'app_name', value: 'AMIS RIM TOGO' },
        { key: 'monthly_contribution', value: '5000' },
        { key: 'currency', value: 'FCFA' },
        { key: 'academic_year', value: '2025-2026' },
    ];

    for (const setting of defaultSettings) {
        await prisma.setting.upsert({
            where: { key: setting.key },
            update: { value: setting.value },
            create: setting,
        });
    }

    console.log('✅ Default settings created');

    console.log('🎉 Database seed completed!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
