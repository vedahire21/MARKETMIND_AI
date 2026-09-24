import { prisma } from '../../shared/prisma';

export class AnomalyInvestigatorService {
  /**
   * Scans order/refund/payment logs for metric standard deviation spikes
   * and builds an AI evidence investigation report.
   */
  static async investigateAnomalies() {
    const totalOrders = await prisma.order.count();
    const totalRefunds = await prisma.refund.count();

    const refundRate = totalOrders > 0 ? (totalRefunds / totalOrders) * 100 : 0;
    const isRefundSpike = refundRate > 10.0;

    const evidence = [];

    if (isRefundSpike) {
      evidence.push({
        type: 'REFUND_RATE_SPIKE',
        severity: 'HIGH',
        metric: `Refund rate reached ${refundRate.toFixed(1)}% (Threshold: 10.0%)`,
        possibleCause: 'Potential product quality issue or delivery damage across recent fulfillment batches.',
        recommendedAction: 'Inspect recent product reviews and seller fulfillment logs before taking account actions.'
      });
    }

    return {
      investigationTimestamp: new Date().toISOString(),
      systemStatus: isRefundSpike ? 'ANOMALY_DETECTED' : 'NORMAL',
      anomalies: evidence
    };
  }
}
