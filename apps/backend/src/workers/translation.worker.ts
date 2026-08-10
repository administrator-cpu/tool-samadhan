import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis.js';
import { EventService } from '../services/event.service.js';
import { logger } from '../lib/logger.js';
import ticketEventEmitter from '../lib/event-emitter.js';
import { TicketEventRepository } from '../repositories/ticket-event.repository.js';
import { db } from '../config/database.js';

export const translationWorker = new Worker(
  'translation-queue',
  async (job: Job) => {
    logger.info(`[TRANSLATION-WORKER] Processing job ${job.id} for event ${job.data.eventId}`);
    
    if (job.name === 'TRANSLATE_MESSAGE') {
      const { eventId, targetLang } = job.data;
      
      try {
        const translatedText = await EventService.translateEvent(eventId, targetLang);
        
        // Fetch the updated event to get the ticketId and updated translations object
        const updatedEvent = await db.transaction(async (tx) => {
          return await TicketEventRepository.findById(tx, eventId);
        });

        if (updatedEvent) {
          // Emit a socket event so the frontend can update live
          ticketEventEmitter.emit('ticket_updated', {
            ticketId: updatedEvent.ticket_id,
            data: { 
              type: 'TRANSLATION_READY', 
              eventId: updatedEvent.id, 
              targetLang, 
              translatedText 
            }
          });
        }
        
        logger.info(`[TRANSLATION-WORKER] Job ${job.id} completed successfully`);
        return { success: true, eventId, translatedText };
      } catch (error) {
        logger.error(`[TRANSLATION-WORKER] Job ${job.id} failed:`, error);
        throw error;
      }
    }
  },
  {
    connection: redisConnection,
    concurrency: 5, // Process 5 translations concurrently
  }
);

translationWorker.on('completed', (job) => {
  logger.info(`[TRANSLATION-WORKER] Job ${job.id} has completed!`);
});

translationWorker.on('failed', (job, err) => {
  logger.error(`[TRANSLATION-WORKER] Job ${job?.id} has failed with ${err.message}`);
});
