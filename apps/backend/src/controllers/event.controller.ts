import { Request, Response } from 'express';
import { EventService } from '../services/event.service.js';
import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/error-codes.js';
import { db } from '../config/database.js';
import { TicketEventRepository } from '../repositories/ticket-event.repository.js';
import ticketEventEmitter from '../lib/event-emitter.js';

export class EventController {
  static async translateEvent(req: Request, res: Response) {
    try {
      const eventId = req.params.id as string;
      const targetLang = req.body.targetLang as string;

      if (!targetLang) {
        throw new AppError(400, 'targetLang is required', ErrorCodes.VALIDATION_ERROR);
      }

      const translation = await EventService.translateEvent(eventId, targetLang);
      
      const updatedEvent = await db.transaction(async (tx) => {
        return await TicketEventRepository.findById(tx, eventId);
      });

      if (updatedEvent) {
        ticketEventEmitter.emit('ticket_updated', {
          ticketId: updatedEvent.ticket_id,
          data: {
            type: 'TRANSLATION_READY',
            eventId: updatedEvent.id,
            targetLang,
            translatedText: translation
          }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          translation
        }
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: ErrorCodes.INTERNAL_ERROR,
            message: 'An unexpected error occurred'
          }
        });
      }
    }
  }
}
