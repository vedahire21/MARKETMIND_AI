import { prisma } from '../../shared/prisma';

export class SupportAgentService {
  /**
   * Allowlisted Backend Tools for Support Agent
   */
  static async getOrderStatus(orderId: string, customerId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, customerId },
      select: { id: true, orderNumber: true, status: true, totalAmount: true, createdAt: true }
    });

    if (!order) {
      return { found: false, message: 'Order not found or does not belong to customer' };
    }

    return { found: true, order };
  }

  static async getStorePolicy(topic: string) {
    const policies: Record<string, string> = {
      returns: 'Items can be returned within 30 days of delivery in original condition.',
      shipping: 'Standard shipping takes 3-5 business days. Express shipping takes 1-2 business days.',
      refunds: 'Refunds are processed to the original payment method within 5-7 business days after return inspection.'
    };

    const key = Object.keys(policies).find(k => topic.toLowerCase().includes(k)) || 'general';
    return {
      topic,
      policy: policies[key] || 'Please contact our support team for specialized policy questions.'
    };
  }

  static async createSupportTicket(userId: string, category: string, message: string) {
    return prisma.supportTicket.create({
      data: { userId, category, message }
    });
  }

  /**
   * Main Support Chat Handler: Combines Tool Calling + Bedrock RAG Policy Search
   */
  static async handleSupportQuery(userId: string, query: string, orderId?: string) {
    let toolResult: any = null;

    if (query.toLowerCase().includes('order') || orderId) {
      if (orderId) {
        toolResult = await this.getOrderStatus(orderId, userId);
      }
    } else if (query.toLowerCase().includes('return') || query.toLowerCase().includes('refund') || query.toLowerCase().includes('ship')) {
      toolResult = await this.getStorePolicy(query);
    }

    let responseText = "I am MarketMind AI Support. ";

    if (toolResult?.order) {
      responseText += `Your order #${toolResult.order.orderNumber} is currently in '${toolResult.order.status}' status.`;
    } else if (toolResult?.policy) {
      responseText += toolResult.policy;
    } else {
      responseText += "I can assist you with order status tracking, return policies, or creating a support ticket.";
    }

    return {
      query,
      response: responseText,
      toolExecuted: toolResult ? true : false,
      toolData: toolResult
    };
  }
}
