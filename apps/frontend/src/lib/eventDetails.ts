export interface TicketEvent {
  id: number;
  event_type: string;
  message: string;
  actor_name: string | null;
  actor_translated_names?: Record<string, string> | null;
  created_at: string;
  metadata: any;
  translations?: Record<string, string>;
  icon?: string;
  title_translations?: Record<string, string>;
}

type Language = "en" | "hi" | "gu" | "bn";

export function translateTitle(title: string, language: Language): string {
  // If the backend already provides `title_translations`, we shouldn't need this often,
  // but keeping it for backward compatibility or cases where we need basic passthrough.
  return title;
}

export function getEventDetails(event: TicketEvent, language: Language, isEmployee: boolean = false) {
    const title = event.title_translations?.[language] || event.title_translations?.['en'] || "System Update";
    const icon = event.icon || "info";

    return {
        icon,
        title,
    };
}