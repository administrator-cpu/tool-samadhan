import { Request, Response, NextFunction } from 'express';
import { sendResponse } from '../utils/response.js';
import { inMemoryCache } from '../utils/cache.js';
import crypto from 'crypto';
import { sendGuestOtpEmail } from '../services/email.service.js';
import { generateTokens } from '../services/jwt.service.js';
import { UserRole } from '../types/dto.js';
import { db } from '../config/database.js';
import { env } from '../config/environment.js';
import { CustomerRepository } from '../repositories/customer.repository.js';
import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/error-codes.js';
import { TicketService } from '../services/ticket.service.js';

export class GuestController {
  static async sendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      if (!email) {
        return next(new AppError(400, 'Email is required', ErrorCodes.VALIDATION_ERROR));
      }

      // Check cache for existing OTP to prevent spam
      const cacheKey = `guest-otp:${email}`;
      const existingOtp = inMemoryCache.get(cacheKey);
      if (existingOtp) {
        return sendResponse({
          res,
          message: 'An OTP was already sent to this email recently. Please check your inbox.',
          data: { alreadySent: true }
        });
      }

      const otpCode = crypto.randomInt(100000, 999999).toString();
      
      // Store in cache for 10 minutes (600 seconds)
      inMemoryCache.set(cacheKey, otpCode, 600);

      await sendGuestOtpEmail({ email, otpCode });

      return sendResponse({
        res,
        message: 'OTP sent successfully to your email.'
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otpCode } = req.body;
      if (!email || !otpCode) {
        return next(new AppError(400, 'Email and OTP are required', ErrorCodes.VALIDATION_ERROR));
      }

      const cacheKey = `guest-otp:${email}`;
      const cachedOtp = inMemoryCache.get(cacheKey);

      if (!cachedOtp || cachedOtp !== otpCode) {
        return next(new AppError(401, 'Invalid or expired OTP', ErrorCodes.UNAUTHORIZED));
      }

      // OTP verified successfully, delete it from cache
      inMemoryCache.delete(cacheKey);

      // Issue a JWT token with GUEST role
      const tokens = generateTokens({ userId: "0", role: UserRole.GUEST, email });

      return sendResponse({
        res,
        message: 'OTP verified successfully.',
        data: tokens
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyCircuit(req: Request, res: Response, next: NextFunction) {
    try {
      const { circuitId } = req.query;
      if (!circuitId) {
        return next(new AppError(400, 'Circuit ID is required', ErrorCodes.VALIDATION_ERROR));
      }

      const response = await fetch(`https://connect-api.fab5connect.com/api/crm/connections/check/${circuitId}`, {
        headers: {
          'x-api-key': env.crmApiKey
        }
      });
      if (!response.ok) {
         return sendResponse({
           res,
           data: { success: false, exists: false }
         });
      }
      const data = await response.json();
      
      return sendResponse({
        res,
        data: data
      });
    } catch (error: any) {
      next(new AppError(500, 'Failed to verify Circuit ID due to an internal error', ErrorCodes.INTERNAL_ERROR));
    }
  }

  static async createTicket(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user?.role !== UserRole.GUEST) {
         return next(new AppError(403, 'Only guests can use this endpoint', ErrorCodes.FORBIDDEN));
      }

      const guestEmail = req.user.email;
      const { circuitId, customerName, contactPhone, categoryId, description } = req.body;
      const alternateEmailInput = req.body.alternateEmail ? req.body.alternateEmail : undefined;
      const metadata = req.body.metadata;

      if (!circuitId || !customerName || !contactPhone || !categoryId) {
        return next(new AppError(400, 'Missing required fields', ErrorCodes.VALIDATION_ERROR));
      }

      let parsedAlternateEmails: string[] = [];
      if (alternateEmailInput) {
        try {
          parsedAlternateEmails = typeof alternateEmailInput === 'string' ? JSON.parse(alternateEmailInput) : alternateEmailInput;
        } catch (e) {
          // fallback if it's not JSON
          parsedAlternateEmails = typeof alternateEmailInput === 'string' ? alternateEmailInput.split(',').map(s => s.trim()) : [];
        }
      }

      // Lookup customer by name (assuming name is exactly matching)
      // Since our schema might have user name, we need to join customers with users
      const customer = await db.transaction(async (tx) => {
         return await CustomerRepository.findByName(tx, customerName);
      });

      if (!customer) {
        return next(new AppError(404, `Customer not found in our records. Please contact support.`, ErrorCodes.CUSTOMER_NOT_FOUND));
      }

      // Delegate to TicketService for automations, assignment, and emails
      const dto = {
        customerId: String(customer.id),
        issueCategoryId: categoryId,
        circuitDescription: circuitId,
        message: description,
        contactPhone: contactPhone,
        alternateEmail: parsedAlternateEmails.length ? parsedAlternateEmails : [guestEmail],
        metadata: { attachments: metadata?.attachments || [] }
      };

      const ticketResult = await TicketService.createTicket(dto, guestEmail, 'GUEST');

      return sendResponse({
        res,
        message: 'Ticket raised successfully',
        data: ticketResult
      });
    } catch (error) {
      next(error);
    }
  }
}
