import { PrismaClient, FacilityType, EmploymentType, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ===========================
  // テナント1: 介護施設
  // ===========================
  const nursingTenant = await prisma.tenant.create({
    data: {
      name: 'さくら介護グループ',
      slug: 'sakura-care',
      plan: 'STANDARD',
      status: 'ACTIVE',
      maxFacilities: 3,
      maxStaffPerFacility: 50,
    },
  });

  const hashedPassword = await bcrypt.hash('password123', 10);

  const nursingAdmin = await prisma.user.create({
    data: {
      email: 'admin@sakura-care.com',
      password: hashedPassword,
      name: '管理者 太郎',
      role: UserRole.ADMIN,
      tenantId: nursingTenant.id,
    },
  });

  const nursingFacility = await prisma.facility.create({
    data: {
      name: 'さくら介護ホーム本館',
      type: FacilityType.NURSING_HOME,
      tenantId: nursingTenant.id,
    },
  });

  // シフトパターン（介護施設）
  const nursingPatterns = await Promise.all([
    prisma.shiftPattern.create({
      data: {
        name: '早番',
        shortName: '早',
        color: '#fbbf24',
        facilityId: nursingFacility.id,
        tenantId: nursingTenant.id,
        startTime: '07:00',
        endTime: '16:00',
        breakMinutes: 60,
        requiredStaff: 3,
        requiredSkills: ['介護福祉士'],
        sortOrder: 1,
      },
    }),
    prisma.shiftPattern.create({
      data: {
        name: '日勤',
        shortName: '日',
        color: '#3b82f6',
        facilityId: nursingFacility.id,
        tenantId: nursingTenant.id,
        startTime: '09:00',
        endTime: '18:00',
        breakMinutes: 60,
        requiredStaff: 5,
        requiredSkills: [],
        sortOrder: 2,
      },
    }),
    prisma.shiftPattern.create({
      data: {
        name: '遅番',
        shortName: '遅',
        color: '#f97316',
        facilityId: nursingFacility.id,
        tenantId: nursingTenant.id,
        startTime: '11:00',
        endTime: '20:00',
        breakMinutes: 60,
        requiredStaff: 3,
        requiredSkills: [],
        sortOrder: 3,
      },
    }),
    prisma.shiftPattern.create({
      data: {
        name: '夜勤',
        shortName: '夜',
        color: '#6366f1',
        facilityId: nursingFacility.id,
        tenantId: nursingTenant.id,
        startTime: '16:00',
        endTime: '09:00',
        breakMinutes: 120,
        requiredStaff: 2,
        requiredSkills: ['看護師'],
        sortOrder: 4,
      },
    }),
  ]);

  // スタッフ（介護施設）
  const nursingStaff = [
    { name: '山田 花子', skills: ['介護福祉士', 'ケアマネージャー'], employmentType: EmploymentType.FULL_TIME, position: '主任' },
    { name: '佐藤 太郎', skills: ['介護福祉士'], employmentType: EmploymentType.FULL_TIME, position: '介護士' },
    { name: '鈴木 美咲', skills: ['看護師'], employmentType: EmploymentType.FULL_TIME, position: '看護師' },
    { name: '田中 健一', skills: ['介護福祉士'], employmentType: EmploymentType.FULL_TIME, position: '介護士' },
    { name: '渡辺 さくら', skills: ['介護福祉士'], employmentType: EmploymentType.PART_TIME, position: 'パート介護士' },
    { name: '伊藤 優子', skills: ['看護師'], employmentType: EmploymentType.FULL_TIME, position: '看護師' },
    { name: '中村 誠', skills: ['介護福祉士'], employmentType: EmploymentType.FULL_TIME, position: '介護士' },
    { name: '小林 愛', skills: [], employmentType: EmploymentType.PART_TIME, position: 'パート' },
    { name: '加藤 拓也', skills: ['介護福祉士'], employmentType: EmploymentType.FULL_TIME, position: '介護士' },
    { name: '吉田 恵', skills: [], employmentType: EmploymentType.PART_TIME, position: 'パート' },
  ];

  for (const staff of nursingStaff) {
    await prisma.staff.create({
      data: {
        ...staff,
        email: `${staff.name.replace(/\s/g, '').toLowerCase()}@sakura-care.com`,
        facilityId: nursingFacility.id,
        tenantId: nursingTenant.id,
        maxHoursPerWeek: staff.employmentType === EmploymentType.FULL_TIME ? 40 : 20,
        maxDaysPerWeek: staff.employmentType === EmploymentType.FULL_TIME ? 5 : 3,
        preferredDays: [1, 2, 3, 4, 5], // 月〜金
      },
    });
  }

  // 制約ルール（介護施設）
  await prisma.constraintRule.create({
    data: {
      name: '最大連続勤務日数',
      description: '5日連続勤務を超えないこと',
      facilityId: nursingFacility.id,
      tenantId: nursingTenant.id,
      type: 'MAX_CONSECUTIVE_DAYS',
      config: { maxDays: 5 },
      priority: 1,
    },
  });

  await prisma.constraintRule.create({
    data: {
      name: '最小休憩時間',
      description: 'シフト間に11時間以上の休憩を確保',
      facilityId: nursingFacility.id,
      tenantId: nursingTenant.id,
      type: 'MIN_REST_HOURS',
      config: { minHours: 11 },
      priority: 1,
    },
  });

  console.log('✅ 介護施設テナント作成完了');

  // ===========================
  // テナント2: 飲食店
  // ===========================
  const restaurantTenant = await prisma.tenant.create({
    data: {
      name: 'イタリアンレストラン ベラヴィータ',
      slug: 'bella-vita',
      plan: 'TRIAL',
      status: 'ACTIVE',
      maxFacilities: 1,
      maxStaffPerFacility: 20,
    },
  });

  const restaurantAdmin = await prisma.user.create({
    data: {
      email: 'manager@bella-vita.com',
      password: hashedPassword,
      name: '店長 次郎',
      role: UserRole.ADMIN,
      tenantId: restaurantTenant.id,
    },
  });

  const restaurant = await prisma.facility.create({
    data: {
      name: 'ベラヴィータ 本店',
      type: FacilityType.RESTAURANT,
      tenantId: restaurantTenant.id,
    },
  });

  // シフトパターン（飲食店）
  const restaurantPatterns = await Promise.all([
    prisma.shiftPattern.create({
      data: {
        name: 'ランチ',
        shortName: 'L',
        color: '#fbbf24',
        facilityId: restaurant.id,
        tenantId: restaurantTenant.id,
        startTime: '10:00',
        endTime: '16:00',
        breakMinutes: 30,
        requiredStaff: 4,
        requiredSkills: [],
        sortOrder: 1,
      },
    }),
    prisma.shiftPattern.create({
      data: {
        name: 'ディナー',
        shortName: 'D',
        color: '#6366f1',
        facilityId: restaurant.id,
        tenantId: restaurantTenant.id,
        startTime: '16:00',
        endTime: '23:00',
        breakMinutes: 30,
        requiredStaff: 5,
        requiredSkills: [],
        sortOrder: 2,
      },
    }),
    prisma.shiftPattern.create({
      data: {
        name: '通し',
        shortName: '通',
        color: '#f97316',
        facilityId: restaurant.id,
        tenantId: restaurantTenant.id,
        startTime: '10:00',
        endTime: '23:00',
        breakMinutes: 120,
        requiredStaff: 2,
        requiredSkills: ['シェフ'],
        sortOrder: 3,
      },
    }),
  ]);

  // スタッフ（飲食店）
  const restaurantStaff = [
    { name: '鈴木 料理長', skills: ['シェフ'], employmentType: EmploymentType.FULL_TIME, position: '料理長' },
    { name: '佐々木 副料理長', skills: ['シェフ'], employmentType: EmploymentType.FULL_TIME, position: '副料理長' },
    { name: '高橋 ホール長', skills: ['ソムリエ'], employmentType: EmploymentType.FULL_TIME, position: 'ホール長' },
    { name: '松本 美咲', skills: [], employmentType: EmploymentType.PART_TIME, position: 'ホールスタッフ' },
    { name: '木村 健太', skills: [], employmentType: EmploymentType.PART_TIME, position: 'ホールスタッフ' },
    { name: '井上 ゆり', skills: [], employmentType: EmploymentType.PART_TIME, position: 'ホールスタッフ' },
    { name: '林 大輔', skills: [], employmentType: EmploymentType.PART_TIME, position: '厨房補助' },
    { name: '清水 あい', skills: [], employmentType: EmploymentType.PART_TIME, position: 'ホールスタッフ' },
  ];

  for (const staff of restaurantStaff) {
    await prisma.staff.create({
      data: {
        ...staff,
        email: `${staff.name.replace(/\s/g, '').toLowerCase()}@bella-vita.com`,
        facilityId: restaurant.id,
        tenantId: restaurantTenant.id,
        maxHoursPerWeek: staff.employmentType === EmploymentType.FULL_TIME ? 40 : 25,
        maxDaysPerWeek: staff.employmentType === EmploymentType.FULL_TIME ? 5 : 4,
        preferredDays: staff.employmentType === EmploymentType.FULL_TIME ? [1, 2, 3, 4, 5] : [5, 6, 0], // FT:平日, PT:金土日
      },
    });
  }

  console.log('✅ 飲食店テナント作成完了');

  // サマリー表示
  console.log('\n📊 シード完了サマリー:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🏢 介護施設テナント');
  console.log(`   Email: admin@sakura-care.com`);
  console.log(`   Password: password123`);
  console.log(`   施設数: 1`);
  console.log(`   スタッフ数: ${nursingStaff.length}`);
  console.log(`   シフトパターン数: ${nursingPatterns.length}`);
  console.log('');
  console.log('🍝 飲食店テナント');
  console.log(`   Email: manager@bella-vita.com`);
  console.log(`   Password: password123`);
  console.log(`   施設数: 1`);
  console.log(`   スタッフ数: ${restaurantStaff.length}`);
  console.log(`   シフトパターン数: ${restaurantPatterns.length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
