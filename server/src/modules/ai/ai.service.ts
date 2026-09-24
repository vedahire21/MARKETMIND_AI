import { prisma } from '../../shared/prisma';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { z } from 'zod';
import { SellerCopilotSchema } from './ai.schema';

type SellerCopilotInput = z.infer<typeof SellerCopilotSchema>;

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

export class AIService {
  /**
   * Seller Copilot: Generates structured title, description, tags, and SEO metadata.
   * Keeps output in DRAFT status until human seller approves.
   */
  static async generateSellerListing(sellerId: string, input: SellerCopilotInput) {
    let generatedContent = {
      title: `${input.productName} - Premium Edition`,
      description: `Introducing the all-new ${input.productName}. ${input.roughNotes} Engineered for high performance and durability.`,
      tags: [input.category.toLowerCase(), 'ai-generated', 'premium'],
      seoTitle: `${input.productName} | Buy Online at MarketMind`,
      seoDesc: `Discover ${input.productName}. High quality ${input.category} with fast shipping and verified seller guarantee.`
    };

    // If Amazon Bedrock environment active in production, call Claude 3.5 Sonnet model
    if (process.env.NODE_ENV === 'production') {
      try {
        const prompt = `You are MarketMind Seller Copilot. Generate a structured JSON listing for product '${input.productName}' in category '${input.category}'. Notes: ${input.roughNotes}. Return valid JSON with keys: title, description, tags (array), seoTitle, seoDesc.`;
        const command = new InvokeModelCommand({
          modelId: 'anthropic.claude-3-5-sonnet-20240620-v1:0',
          contentType: 'application/json',
          accept: 'application/json',
          body: JSON.stringify({
            anthropic_version: 'bedrock-2023-05-31',
            max_tokens: 1000,
            messages: [{ role: 'user', content: prompt }]
          })
        });

        const response = await bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        if (responseBody.content?.[0]?.text) {
          const parsed = JSON.parse(responseBody.content[0].text);
          generatedContent = { ...generatedContent, ...parsed };
        }
      } catch (err) {
        // Fallback to deterministic template generator on error
      }
    }

    // Find or create default category
    let category = await prisma.category.findFirst({
      where: { name: { equals: input.category, mode: 'insensitive' } }
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: input.category,
          slug: input.category.toLowerCase().replace(/\s+/g, '-')
        }
      });
    }

    const baseSlug = input.productName.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^\w-]/g, '');
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    // Create Product in DRAFT state (Human-in-the-Loop)
    const draftProduct = await prisma.product.create({
      data: {
        sellerId,
        categoryId: category.id,
        title: generatedContent.title,
        slug,
        description: generatedContent.description,
        tags: generatedContent.tags,
        seoTitle: generatedContent.seoTitle,
        seoDesc: generatedContent.seoDesc,
        status: 'DRAFT'
      },
      include: { category: true }
    });

    return {
      product: draftProduct,
      approvalRequired: true,
      message: 'Product draft generated successfully by Seller Copilot. Review and click approve to publish.'
    };
  }

  /**
   * Human-in-the-loop: Explicit approval transitions product from DRAFT to ACTIVE
   */
  static async approveProductListing(productId: string, sellerId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw { status: 404, code: 'PRODUCT_NOT_FOUND', message: 'Product not found' };
    }

    if (product.sellerId !== sellerId) {
      throw { status: 403, code: 'FORBIDDEN', message: 'You do not own this product' };
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: { status: 'ACTIVE' }
    });

    return {
      product: updated,
      message: 'Product listing approved and published to active catalog.'
    };
  }
}
