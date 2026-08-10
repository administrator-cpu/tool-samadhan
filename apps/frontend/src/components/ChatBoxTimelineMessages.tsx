import { format } from "date-fns";
import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import FAB5Logo from "@/assets/FAB5-logo.webp";
import Image from "next/image";
import Lightbox from "@/components/Lightbox";
import { api } from "@/lib/api";
import { useEffect } from "react";
import { useLanguageStore } from "@/store/useLanguageStore";
import { getEventDetails , TicketEvent } from "@/lib/eventDetails";

interface TimelineProps {
  events: TicketEvent[];
  onTranslationUpdate?: (eventId: number, lang: string, text: string) => void;
}

export default function Timeline({ events, onTranslationUpdate }: TimelineProps) {
  const { user } = useAuthStore();
  const isEmployee = !!user && user.role !== "USER";
  const [lightboxData, setLightboxData] = useState<{ images: string[], currentIndex: number } | null>(null);
  
  const { targetLang } = useLanguageStore();
  const [translatingEvents, setTranslatingEvents] = useState<Set<number>>(new Set());

  const visibleEvents = events;

  // Function to translate on-demand
  const requestTranslation = async (eventId: number) => {
    if (translatingEvents.has(eventId)) return;
    setTranslatingEvents((prev) => new Set(prev).add(eventId));
    try {
      const res = await api.post(`/events/${eventId}/translate`, { targetLang: "hi" });
      if (res.data?.data?.translation && onTranslationUpdate) {
        onTranslationUpdate(eventId, "hi", res.data.data.translation);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTranslatingEvents((prev) => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
    }
  };

  // Effect to trigger translations when changing targetLang
  useEffect(() => {
    if (targetLang === "hi") {
      visibleEvents.forEach((event) => {
        if (!event.translations?.hi && event.message && event.message.trim() !== "") {
          requestTranslation(event.id);
        }
      });
    }
  }, [targetLang, visibleEvents]);


  return (
    <section
      className="xl:col-span-2 px-0 pb-20 mt-10 relative"
      data-purpose="ticket-timeline"
    >
      <div className="relative pl-6 sm:pl-10 pb-8">
        {visibleEvents.map((event, index) => {
          const isUser = event.event_type === "TICKET_CREATED" || event.event_type === "USER_REPLY";
          const isLast = index === visibleEvents.length - 1 && events[0].event_type === "CLOSED";
          
          const { icon, title } = getEventDetails(event, targetLang);
          return (
            <div key={event.id} className="relative mb-10 timeline-item z-10">
              {/* Spine Line - Only show if not the very last overall node */}
              {index < visibleEvents.length - 1 && (
                <div className="absolute left-[-2px] sm:left-[-17px] top-10 bottom-[-48px] w-[2px] bg-slate-200 z-0" />
              )}

              {/* Node Dot */}
              <div
                className={`absolute -left-3 sm:-left-[32px] top-1 w-8 h-8 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center z-10 shadow-sm`}
              >
                <span className="material-symbols-outlined text-lg text-slate-500">
                  {icon}
                </span>
              </div>

              <div
                className={`mb-2 ml-2 flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <h3 className="font-heading font-semibold text-lg text-black flex items-center gap-2 mt-1">
                  {title}
                </h3>
              </div>

              {/* Message Card */}

              {((event.message && event.message.trim() !== "") || (event.metadata?.attachments && event.metadata.attachments.length > 0)) && !(event.event_type === "STATUS_CHANGED" && !isEmployee) && (
                  <div
                    className={`flex w-full ${isUser ? "justify-end" : "justify-start"} items-start`}
                  >
                    <div
                      className={`flex flex-col gap-3 pl-2 ${isUser ? "items-end" : "items-start"} w-full min-w-0`}
                    >
                      <div
                        className={`max-w-[80%] flex flex-col gap-3 ${isUser ? "items-end text-right" : "items-start text-left"} min-w-0`}
                      >
                        <div
                          className={`flex flex-col ${isUser ? "items-end" : "items-start"} gap-1 text-slate-500 mb-1 font-semibold leading-normal`}
                        >
                          {![
                            "AGENT_REPLY",
                            "MANAGER_REPLY",
                            "ADMIN_REPLY",
                          ].includes(event.event_type) ? (
                            <div
                              className={`flex flex-row items-center gap-2 ${isUser ? "flex-row-reverse" : ""}`}
                            >
                              <span className="text-xs font-body font-semibold">
                                {isUser
                                  ? isEmployee
                                    ? event.actor_name || "Customer"
                                    : "You"
                                  : event.actor_name || "Samadhan AI"}
                              </span>
                              {/*{["AGENT_REPLY", "MANAGER_REPLY", "ADMIN_REPLY"].includes(event.event_type) && (
                            <span className="text-xs font-body text-primary font-semibold bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                              {getRoleLabel(event.event_type)}
                            </span>
                          )}*/}
                              <span className="text-xs font-body text-muted font-semibold ml-1">
                                {format(
                                  new Date(event.created_at),
                                  "MMM d, h:mm a",
                                )}
                              </span>
                            </div>
                          ) : (
                            ""
                          )}

                          <div className="flex flex-col gap-2 w-full">
                            {event.message && event.message.trim() !== "" && (
                              <div
                                className={`pt-2 pb-3 px-3 rounded-2xl shadow-xs border overflow-hidden max-w-fit ${isUser
                                    ? "bg-emerald-700 text-white border-emerald-800 rounded-tr-sm self-end"
                                    : "bg-white text-slate-900 border-gray-200 rounded-tl-sm self-start"
                                  }`}
                              >
                                {!isUser && [ "AGENT_REPLY", "MANAGER_REPLY", "ADMIN_REPLY" ].includes(event.event_type) ? (
                                  <div className="flex items-center gap-2 justify-end mb-2 align-middle">
                                    <span className="text-xs font-body text-muted font-semibold ml-1">
                                      {format(
                                        new Date(event.created_at),
                                        "MMM d, yyyy, h:mm a",
                                      )}
                                    </span>
                                    <Image
                                      src={FAB5Logo.src}
                                      alt="FAB5 Logo"
                                      width={30}
                                      height={30}
                                      className="bg-transparent"
                                    />
                                  </div>
                                ) : (
                                  ""
                                )}
                                <p className="text-[15px] leading-relaxed font-body font-medium whitespace-pre-wrap">
                                  {targetLang === "hi" && !event.translations?.hi && translatingEvents.has(event.id) ? (
                                    <span className="flex items-center gap-2 text-slate-400">
                                      <span className="h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
                                      Translating...
                                    </span>
                                  ) : (
                                    targetLang === "hi" && event.translations?.hi ? event.translations.hi : event.message
                                  )}
                                </p>
                                {event.event_type === "TICKET_RCA_UPDATED" && event.metadata?.rca && (
                                  <div className="mt-2 p-3 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-700 whitespace-pre-wrap font-medium">
                                    <div className="font-bold text-xs uppercase text-slate-400 tracking-wider mb-1">RCA Details</div>
                                    {event.metadata.rca}
                                  </div>
                                )}
                              </div>
                            )}

                            {event.metadata?.attachments && Array.isArray(event.metadata.attachments) && event.metadata.attachments.length > 0 && (
                              <div className={`grid gap-2 mt-2 ${isUser ? "self-end" : "self-start"} ${event.metadata.attachments.length === 1 ? 'grid-cols-1' : event.metadata.attachments.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
                                {event.metadata.attachments.map((url: string, imgIdx: number) => (
                                  <button 
                                    key={imgIdx} 
                                    onClick={() => setLightboxData({ images: event.metadata.attachments, currentIndex: imgIdx })} 
                                    type="button" 
                                    className="block relative aspect-square rounded-xl overflow-hidden border border-black/10 shadow-sm hover:opacity-90 hover:scale-[1.02] transition-all bg-slate-100 cursor-zoom-in w-[150px] h-[150px]"
                                  >
                                    <Image src={url} alt={`Attachment ${imgIdx + 1}`} className="object-cover" fill/>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}


            </div>
          );
        })}
      </div>

      {lightboxData && (
        <Lightbox
          images={lightboxData.images}
          initialIndex={lightboxData.currentIndex}
          onClose={() => setLightboxData(null)}
        />
      )}
    </section>
  );
}
