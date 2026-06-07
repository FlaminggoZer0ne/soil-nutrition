const bcrypt = require('bcryptjs');
const { User, PHData, WeeklyPopulasi, PG, Block, LocationStatus } = require('../models');

async function seedDatabase() {
  try {
    // Seed Location Statuses if empty
    const statusCount = await LocationStatus.count();
    if (statusCount === 0) {
      const initialStatuses = [
        { nama: 'PSFC' },
        { nama: 'PSSC' },
        { nama: 'PSSR' },
        { nama: 'PS3R' },
        { nama: 'PS4R' }
      ];
      await LocationStatus.bulkCreate(initialStatuses);
      console.log('✅ Location statuses seeded successfully!');
    }

    // Check if users already exist
    const userCount = await User.count();
    if (userCount > 0) {
      // Database already seeded
      return;
    }

    console.log('🌱 Starting database seeding...');

    // Hashing passwords
    const adminPasswordHash = await bcrypt.hash('admin123', 12);
    const userPasswordHash = await bcrypt.hash('user123', 12);

    // Create Admin
    const admin = await User.create({
      nama: 'Administrator Soil Lab',
      index_pegawai: 'admin',
      password_hash: adminPasswordHash,
      role: 'admin',
      pg_akses: ['PG1', 'PG3', 'PG4'],
      aktif: true
    });

    // Create User (Field Officer)
    const officer = await User.create({
      nama: 'Ahmad Officer PG3',
      index_pegawai: '10234',
      password_hash: userPasswordHash,
      role: 'user',
      pg_akses: ['PG3'],
      aktif: true
    });

    console.log('✅ Users seeded successfully!');

    // Create PGs
    const initialPGs = [
      { nama: 'PG1' },
      { nama: 'PG3' },
      { nama: 'PG4' }
    ];
    await PG.bulkCreate(initialPGs);
    console.log('✅ PGs seeded successfully!');

    // Create Blocks (Dibuat oleh Admin)
    const initialBlocks = [
      { pg: 'PG1', block_code: '055A3', status: 'PSSC', luas: 12.5, populasi: 18500, clone: 'Co3', wk_tanam: 12, tahun_tanam: 2023, tanggal_tanam: '2023-03-20' },
      { pg: 'PG3', block_code: '554E2A', status: 'PSFC', luas: 15.2, populasi: 22000, clone: 'Bululawang', wk_tanam: 45, tahun_tanam: 2023, tanggal_tanam: '2023-11-10' },
      { pg: 'PG3', block_code: '554E2B', status: 'PS3R', luas: 11.0, populasi: 16500, clone: 'PS862', wk_tanam: 5, tahun_tanam: 2024, tanggal_tanam: '2024-02-01' },
      { pg: 'PG3', block_code: '554E2C', status: 'PSSR', luas: 8.5, populasi: 12800, clone: 'Bululawang', wk_tanam: 18, tahun_tanam: 2024, tanggal_tanam: '2024-05-05' },
      { pg: 'PG4', block_code: '412C1-A1', status: 'PSSR', luas: 9.8, populasi: 14000, clone: 'PS862', wk_tanam: 28, tahun_tanam: 2023, tanggal_tanam: '2023-07-15' },
      { pg: 'PG4', block_code: '412C1-A2', status: 'PS3R', luas: 14.3, populasi: 20500, clone: 'Co3', wk_tanam: 35, tahun_tanam: 2023, tanggal_tanam: '2023-09-01' }
    ];
    await Block.bulkCreate(initialBlocks);
    console.log('✅ Blocks seeded successfully!');

    // Create Weekly Populasi
    const weeklyData = [
      { pg: 'PG1', block: '055A3', status: 'PSSC', luas: 12.5, populasi: 18500, clone: 'Co3', wk_tanam: 12, tahun_tanam: 2023, tanggal_tanam: '2023-03-20', week_data: 51, tahun_data: 2023 },
      { pg: 'PG3', block: '554E2A', status: 'PSFC', luas: 15.2, populasi: 22000, clone: 'Bululawang', wk_tanam: 45, tahun_tanam: 2023, tanggal_tanam: '2023-11-10', week_data: 51, tahun_data: 2023 },
      { pg: 'PG3', block: '554E2B', status: 'PS3R', luas: 11.0, populasi: 16500, clone: 'PS862', wk_tanam: 5, tahun_tanam: 2024, tanggal_tanam: '2024-02-01', week_data: 52, tahun_data: 2024 },
      { pg: 'PG3', block: '554E2C', status: 'PSSR', luas: 8.5, populasi: 12800, clone: 'Bululawang', wk_tanam: 18, tahun_tanam: 2024, tanggal_tanam: '2024-05-05', week_data: 52, tahun_data: 2024 },
      { pg: 'PG4', block: '412C1-A1', status: 'PSSR', luas: 9.8, populasi: 14000, clone: 'PS862', wk_tanam: 28, tahun_tanam: 2023, tanggal_tanam: '2023-07-15', week_data: 51, tahun_data: 2023 },
      { pg: 'PG4', block: '412C1-A2', status: 'PS3R', luas: 14.3, populasi: 20500, clone: 'Co3', wk_tanam: 35, tahun_tanam: 2023, tanggal_tanam: '2023-09-01', week_data: 51, tahun_data: 2023 }
    ];

    await WeeklyPopulasi.bulkCreate(weeklyData);
    console.log('✅ Weekly populasi seeded successfully!');

    // Create PH Sample Data (Empty by default)
    const phSamples = [];
    await PHData.bulkCreate(phSamples);
    console.log('✅ pH samples seeded successfully!');
    console.log('🌱 Database seeding complete.');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}

module.exports = seedDatabase;
