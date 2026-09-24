import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding MarketMind AI database...\n');

  // 1. Create Users
  const sellerUser = await prisma.user.upsert({
    where: { email: 'seller@marketmind.ai' },
    update: {},
    create: {
      email: 'seller@marketmind.ai',
      name: 'Apex Global Seller',
      passwordHash: '$2a$10$wT8B1o5O0pL10mNqB2aD..yJ4W2M8.gG8sW7bMhKzL/y6kI4kM6/q',
      role: 'SELLER'
    }
  });

  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@marketmind.ai' },
    update: {},
    create: {
      email: 'customer@marketmind.ai',
      name: 'Alex Johnson',
      passwordHash: '$2a$10$wT8B1o5O0pL10mNqB2aD..yJ4W2M8.gG8sW7bMhKzL/y6kI4kM6/q',
      role: 'CUSTOMER'
    }
  });

  console.log(`✅ Users: ${sellerUser.email}, ${customerUser.email}`);

  // 2. Create SellerProfile
  const sellerProfile = await prisma.sellerProfile.upsert({
    where: { userId: sellerUser.id },
    update: {},
    create: {
      userId: sellerUser.id,
      storeName: 'Apex Electronics Hub',
      description: 'Premium marketplace seller specializing in AI-powered electronics and smart home gadgets.',
      kycVerified: true,
      rating: 4.8
    }
  });

  console.log(`✅ Seller Profile: ${sellerProfile.storeName}`);

  // 3. Create Categories
  const categoryData = [
    { name: 'Electronics', slug: 'electronics' },
    { name: 'Office', slug: 'office' },
    { name: 'Home & Garden', slug: 'home-garden' },
    { name: 'Fitness', slug: 'fitness' }
  ];

  const categories: Record<string, any> = {};
  for (const cat of categoryData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat
    });
    categories[cat.slug] = created;
    console.log(`✅ Category: ${created.name}`);
  }

  // 4. Create Products with Variants and Inventory
  const productSeeds = [
    {
      sellerId: sellerProfile.id,
      categoryId: categories['electronics'].id,
      title: 'Smart AI Security Camera 4K',
      slug: 'smart-ai-security-camera-4k',
      description: 'Ultra HD 4K night vision security camera with built-in Bedrock computer vision threat detection and real-time cloud alert dispatching.',
      tags: ['ai', 'security', 'camera', 'smarthome'],
      seoTitle: 'Smart AI Security Camera 4K | MarketMind Store',
      seoDesc: 'Shop the official Smart AI Security Camera 4K with AI-powered threat detection.',
      status: 'ACTIVE' as const,
      variants: [
        { sku: 'CAM-4K-BLK', name: 'Black Edition', price: 199.99, attributes: { color: 'Black', resolution: '4K' }, qty: 25 },
        { sku: 'CAM-4K-WHT', name: 'White Edition', price: 199.99, attributes: { color: 'White', resolution: '4K' }, qty: 18 }
      ]
    },
    {
      sellerId: sellerProfile.id,
      categoryId: categories['electronics'].id,
      title: 'Noise Cancelling Wireless Earbuds Pro',
      slug: 'noise-cancelling-wireless-earbuds-pro',
      description: '40-hour battery life with active ANC acoustic cancellation, spatial audio, and wireless charging case.',
      tags: ['audio', 'wireless', 'anc', 'gadgets'],
      seoTitle: 'Noise Cancelling Wireless Earbuds Pro | MarketMind Store',
      seoDesc: 'Premium ANC earbuds with 40hr battery and spatial audio.',
      status: 'ACTIVE' as const,
      variants: [
        { sku: 'EAR-ANC-BLK', name: 'Matte Black', price: 129.50, attributes: { color: 'Matte Black' }, qty: 45 },
        { sku: 'EAR-ANC-SLV', name: 'Silver', price: 134.99, attributes: { color: 'Silver' }, qty: 32 }
      ]
    },
    {
      sellerId: sellerProfile.id,
      categoryId: categories['office'].id,
      title: 'Ergonomic Mesh Executive Chair',
      slug: 'ergonomic-mesh-executive-chair',
      description: 'Dynamic lumbar support, 4D adjustable armrests, and breathable high-tensile mesh engineered for 12+ hour focus sessions.',
      tags: ['furniture', 'ergonomic', 'office', 'chair'],
      seoTitle: 'Ergonomic Mesh Executive Chair | MarketMind Store',
      seoDesc: 'Premium office chair with dynamic lumbar support and 4D armrests.',
      status: 'ACTIVE' as const,
      variants: [
        { sku: 'CHR-ERG-BLK', name: 'Black Mesh', price: 349.00, attributes: { color: 'Black', material: 'Mesh' }, qty: 12 }
      ]
    },
    {
      sellerId: sellerProfile.id,
      categoryId: categories['electronics'].id,
      title: 'Titanium Mechanical Keyboard (Tactile)',
      slug: 'titanium-mechanical-keyboard-tactile',
      description: 'Gasket-mounted hot-swappable tactile switches with CNC aluminum chassis and programmable per-key RGB backlighting.',
      tags: ['keyboard', 'mechanical', 'custom', 'rgb'],
      seoTitle: 'Titanium Mechanical Keyboard | MarketMind Store',
      seoDesc: 'Premium hot-swappable mechanical keyboard with CNC aluminum chassis.',
      status: 'ACTIVE' as const,
      variants: [
        { sku: 'KBD-TIT-65', name: '65% Layout', price: 179.00, attributes: { layout: '65%', switches: 'Tactile' }, qty: 30 },
        { sku: 'KBD-TIT-75', name: '75% Layout', price: 199.00, attributes: { layout: '75%', switches: 'Tactile' }, qty: 22 }
      ]
    }
  ];

  for (const seed of productSeeds) {
    const { variants, ...productData } = seed;

    // Check if product already exists by slug
    const existing = await prisma.product.findUnique({ where: { slug: productData.slug } });
    if (existing) {
      console.log(`⏭️  Product already exists: ${productData.title}`);
      continue;
    }

    const product = await prisma.product.create({
      data: {
        ...productData,
        variants: {
          create: variants.map(v => ({
            sku: v.sku,
            name: v.name,
            price: v.price,
            attributes: v.attributes,
            inventory: {
              create: {
                quantity: v.qty,
                reservedQuantity: 0,
                reorderPoint: 5
              }
            }
          }))
        }
      },
      include: {
        variants: { include: { inventory: true } }
      }
    });

    console.log(`✅ Product: ${product.title} (${product.variants.length} variants)`);
  }

  console.log('\n🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
