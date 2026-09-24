import { prisma } from '../../shared/prisma';

export interface CartItem {
  variantId: string;
  quantity: number;
}

// Memory / Session Cart storage (replaceable with Redis client in prod)
const cartStore = new Map<string, CartItem[]>();

export class CartService {
  static async getCart(userId: string) {
    const items = cartStore.get(userId) || [];
    if (items.length === 0) {
      return { items: [], totalAmount: 0 };
    }

    const variantIds = items.map(i => i.variantId);
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: {
        product: { select: { title: true, slug: true } },
        inventory: true
      }
    });

    let totalAmount = 0;
    const enrichedItems = items.map(item => {
      const variant = variants.find(v => v.id === item.variantId);
      const priceNumber = variant ? Number(variant.price) : 0;
      const subtotal = priceNumber * item.quantity;
      totalAmount += subtotal;

      return {
        variantId: item.variantId,
        quantity: item.quantity,
        title: variant?.product.title || 'Unknown Product',
        variantName: variant?.name || 'Default',
        sku: variant?.sku,
        unitPrice: priceNumber,
        subtotal,
        availableStock: variant?.inventory ? variant.inventory.quantity - variant.inventory.reservedQuantity : 0
      };
    });

    return { items: enrichedItems, totalAmount };
  }

  static async addItem(userId: string, variantId: string, quantity: number) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { inventory: true }
    });

    if (!variant || !variant.inventory) {
      throw { status: 404, code: 'VARIANT_NOT_FOUND', message: 'Product variant not found' };
    }

    const available = variant.inventory.quantity - variant.inventory.reservedQuantity;
    if (available < quantity) {
      throw { status: 400, code: 'INSUFFICIENT_STOCK', message: `Only ${available} units available in stock` };
    }

    let userCart = cartStore.get(userId) || [];
    const existingIndex = userCart.findIndex(i => i.variantId === variantId);

    if (existingIndex > -1) {
      userCart[existingIndex].quantity += quantity;
    } else {
      userCart.push({ variantId, quantity });
    }

    cartStore.set(userId, userCart);
    return this.getCart(userId);
  }

  static async removeItem(userId: string, variantId: string) {
    let userCart = cartStore.get(userId) || [];
    userCart = userCart.filter(i => i.variantId !== variantId);
    cartStore.set(userId, userCart);
    return this.getCart(userId);
  }

  static async clearCart(userId: string) {
    cartStore.delete(userId);
  }
}
