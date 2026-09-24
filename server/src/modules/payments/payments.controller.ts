import { Request, Response, NextFunction } from 'express';
import { PaymentsService } from './payments.service';
import { AuthenticatedRequest } from '../../shared/authMiddleware';

export class PaymentsController {
  static async createRazorpayOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.body;
      const result = await PaymentsService.createRazorpayOrder(orderId, req.user!.userId);
      return res.status(201).json(result);
    } catch (err: any) {
      if (err.status) {
        return res.status(err.status).json({ error: err.code, message: err.message });
      }
      next(err);
    }
  }

  static async verifyPayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
      const result = await PaymentsService.verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);
      return res.status(200).json(result);
    } catch (err: any) {
      if (err.status) {
        return res.status(err.status).json({ error: err.code, message: err.message });
      }
      next(err);
    }
  }

  static async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = (req.headers['x-razorpay-signature'] as string) || '';
      const eventId = (req.headers['x-razorpay-event-id'] as string) || `evt_${Date.now()}`;
      
      const result = await PaymentsService.handleWebhook(req.body, signature, eventId);
      return res.status(200).json(result);
    } catch (err: any) {
      if (err.status) {
        return res.status(err.status).json({ error: err.code, message: err.message });
      }
      next(err);
    }
  }
}
