import { prisma } from '../../shared/prisma';

export class InventoryService {
  /**
   * Atomically reserve stock during checkout initialization.
   * Ensures quantity - reservedQuantity >= requestedQuantity.
   */
  static async reserveStock(variantId: string, requestedQuantity: number, tx: any = prisma) {
    const inventory = await tx.inventory.findUnique({
      where: { variantId }
    });

    if (!inventory) {
      throw { status: 404, code: 'INVENTORY_NOT_FOUND', message: `No inventory record found for variant '${variantId}'` };
    }

    const availableQuantity = inventory.quantity - inventory.reservedQuantity;

    if (availableQuantity < requestedQuantity) {
      throw {
        status: 400,
        code: 'INSUFFICIENT_STOCK',
        message: `Insufficient stock for variant '${variantId}'. Requested: ${requestedQuantity}, Available: ${availableQuantity}`
      };
    }

    return tx.inventory.update({
      where: { variantId },
      data: {
        reservedQuantity: { increment: requestedQuantity }
      }
    });
  }

  /**
   * Release reserved stock if checkout is cancelled or times out.
   */
  static async releaseStock(variantId: string, quantityToRelease: number, tx: any = prisma) {
    return tx.inventory.update({
      where: { variantId },
      data: {
        reservedQuantity: { decrement: quantityToRelease }
      }
    });
  }

  /**
   * Deduct stock permanently when payment is verified.
   */
  static async deductStock(variantId: string, quantityToDeduct: number, tx: any = prisma) {
    return tx.inventory.update({
      where: { variantId },
      data: {
        quantity: { decrement: quantityToDeduct },
        reservedQuantity: { decrement: quantityToDeduct }
      }
    });
  }
}
