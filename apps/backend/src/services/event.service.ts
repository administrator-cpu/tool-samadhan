import { db } from '../config/database.js';
import { TicketEventRepository } from '../repositories/ticket-event.repository.js';
import { UserRepository } from '../repositories/user.repository.js';
import { EmployeeRepository } from '../repositories/employee.repository.js';
import { TranslationFactory } from './translation/translation.factory.js';
import { STATIC_TRANSLATIONS } from '../constants/translations.js';
import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/error-codes.js';

export class EventService {
  static async translateEvent(eventId: string, targetLang: string): Promise<string> {
    return db.transaction(async (tx) => {
      const event = await TicketEventRepository.findById(tx, eventId);
      
      if (!event) throw new AppError(404, 'Event not found', ErrorCodes.VALIDATION_ERROR);

      // 1. If already translated, return it immediately
      if (event.translations && event.translations[targetLang]) {
        return event.translations[targetLang];
      }

      // Actor Name Resolution (translates and saves 1st name for ANY actor in the background)
      if (event.actor_user_id) {
        const actorUser = await UserRepository.findById(tx, event.actor_user_id);
        if (actorUser && (!actorUser.translated_names || !actorUser.translated_names[targetLang])) {
          const firstName = actorUser.name.split(' ')[0];
          try {
            const transliterated = await TranslationFactory.translateSafely(firstName, targetLang);
            const newNames = { ...(actorUser.translated_names || {}), [targetLang]: transliterated };
            await UserRepository.updateTranslatedNames(tx, actorUser.id, newNames);
          } catch (err) {
            // Ignore error so we don't fail the event translation
          }
        }
      }

      let translatedText = '';

      // 2. Global Exact Match Check (Trimmed & Lowercased) against STATIC_TRANSLATIONS
      if (event.message) {
        const normalizedMessage = event.message.trim().toLowerCase();
        for (const key of Object.keys(STATIC_TRANSLATIONS)) {
          const enText = STATIC_TRANSLATIONS[key]['en'];
          if (enText && enText.trim().toLowerCase() === normalizedMessage) {
            if (STATIC_TRANSLATIONS[key][targetLang]) {
              translatedText = STATIC_TRANSLATIONS[key][targetLang];
            }
            break;
          }
        }
      }



      // 3. Static Translation (System Events)
      if (!translatedText && STATIC_TRANSLATIONS[event.event_type]) {
        let template = STATIC_TRANSLATIONS[event.event_type][targetLang] || STATIC_TRANSLATIONS[event.event_type]['en'];
        
        // Handle reassignment string variation dynamically inside the TICKET_ASSIGNED event
        if (event.event_type === 'TICKET_ASSIGNED' && event.message && event.message.startsWith("Ticket reassigned to ")) {
          template = targetLang === 'hi' ? 'टिकट {{agentName}} को फिर से सौंपा गया' : 'Ticket reassigned to {{agentName}}';
        }
        
        translatedText = template;

        // Variables injection logic
        if (event.event_type === 'TICKET_ASSIGNED' && event.metadata.assigned_to) {
          const employee = await EmployeeRepository.findByRowId(tx, event.metadata.assigned_to);
          if (employee) {
            const assignedUser = await UserRepository.findById(tx, employee.user_id);
            if (assignedUser) {
              let agentName = assignedUser.name;
              // Agent Name Resolution
              if (assignedUser.translated_names && assignedUser.translated_names[targetLang]) {
                agentName = assignedUser.translated_names[targetLang];
              } else {
                // Transliterate 1st name using API once and save
                const firstName = agentName.split(' ')[0];
                const transliterated = await TranslationFactory.translateSafely(firstName, targetLang);
                agentName = transliterated;
                const newNames = { ...(assignedUser.translated_names || {}), [targetLang]: transliterated };
                await UserRepository.updateTranslatedNames(tx, assignedUser.id, newNames);
              }
              translatedText = translatedText.replace('{{agentName}}', agentName);
            }
          }
        } else if (event.event_type === 'STATUS_CHANGED') {
          // Translate the statuses using generic API or map
          const oldStatus = await TranslationFactory.translateSafely(event.metadata.oldStatus || '', targetLang);
          const newStatus = await TranslationFactory.translateSafely(event.metadata.newStatus || '', targetLang);
          translatedText = translatedText.replace('{{oldStatus}}', oldStatus).replace('{{newStatus}}', newStatus);
        }
      }

      // 5. Custom API Translation Fallback
      if (!translatedText && event.message) {
        translatedText = await TranslationFactory.translateSafely(event.message, targetLang);
      }

      // Save back to DB
      if (translatedText) {
        const newTranslations = { ...(event.translations || {}), [targetLang]: translatedText };
        await TicketEventRepository.updateTranslations(tx, event.id, newTranslations);
      }

      return translatedText;
    });
  }
}
