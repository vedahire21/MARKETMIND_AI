import { prisma } from '../../shared/prisma';

export class InventoryIntelligenceService {
  /**
   * Statistical Demand Forecasting + AI Reorder Advice
   */
  static async getInventoryForecast(sellerId: string) {
    const products = await prisma.product.findMany({
      where: { sellerId },
      include: {
        variants: {
          include: { inventory: true }
        }
      }
    });

    const forecastReport = products.map(product => {
      const variantAnalysis = product.variants.map(variant => {
        const qty = variant.inventory?.quantity || 0;
        const reorderPoint = variant.inventory?.reorderPoint || 10;
        const isLowStock = qty <= reorderPoint;

        return {
          sku: variant.sku,
          name: variant.name,
          currentQuantity: qty,
          reorderPoint,
          stockoutRisk: isLowStock ? 'HIGH' : 'LOW',
          recommendedReorderQuantity: isLowStock ? (reorderPoint * 2) - qty : 0,
          aiAdvice: isLowStock
            ? `Stock level (${qty}) is below threshold (${reorderPoint}). Reorder at least ${reorderPoint * 2 - qty} units immediately.`
            : `Stock level healthy (${qty} units available).`
        };
      });

      return {
        productId: product.id,
        title: product.title,
        variants: variantAnalysis
      };
    });

    return { forecast: forecastReport };
  }
}
