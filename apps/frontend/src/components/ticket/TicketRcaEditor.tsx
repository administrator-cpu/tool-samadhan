"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Info, XCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import Lightbox from "@/components/Lightbox";

interface TicketRcaEditorProps {
  rca: string | null;
  rcaImages?: string[];
  onUpdateRca: (formData: FormData) => Promise<void>;
  savingRca: boolean;
}

export default function TicketRcaEditor({ rca, rcaImages: initialRcaImages, onUpdateRca, savingRca }: TicketRcaEditorProps) {
  const [rcaText, setRcaText] = useState(rca || "");
  const [isEditingRca, setIsEditingRca] = useState(false);
  const [rcaImages, setRcaImages] = useState<string[]>(initialRcaImages || []);
  const [rcaFiles, setRcaFiles] = useState<File[]>([]);
  const [lightboxData, setLightboxData] = useState<{ images: string[], currentIndex: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (!rcaText.trim()) {
      toast.error("Please enter RCA details");
      return;
    }

    if (rcaImages.length + rcaFiles.length > 10) {
      toast.error("Maximum of 10 images allowed for RCA.");
      return;
    }

    const maxFileSize = 5 * 1024 * 1024;
    for (const file of rcaFiles) {
      if (file.size > maxFileSize) {
        toast.error(`File ${file.name} exceeds 5MB limit`);
        return;
      }
    }

    const formData = new FormData();
    formData.append("rca", rcaText);
    formData.append("existingImages", JSON.stringify(rcaImages));
    
    rcaFiles.forEach((file) => {
      formData.append("files", file);
    });

    await onUpdateRca(formData);
    setIsEditingRca(false);
    setRcaFiles([]);
  };

  return (
    <div className="max-w-4xl mx-auto w-full mt-10 pt-10 border-t border-slate-100 pb-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
            <Info size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Root Cause Analysis</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Internal Investigation Report</p>
          </div>
        </div>
        {rca ? (
          <button
              onClick={() => {
                setRcaText(rca || "");
                setRcaImages(initialRcaImages || []);
                setRcaFiles([]);
                setIsEditingRca(true);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-xs">edit</span>
              Edit RCA
            </button>
        ) : (
          <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-1 rounded-md border border-amber-100">
            PENDING AGENT SUBMISSION
          </span>
        )}
      </div>

      {rca && !isEditingRca ? (
        <div className="relative rounded-lg border border-slate-100 bg-slate-50/50 p-6 shadow-sm">
          <div className="whitespace-pre-line text-sm font-medium text-slate-800 leading-relaxed">
            {rca}
          </div>
          {initialRcaImages && initialRcaImages.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {initialRcaImages.map((img, idx) => (
                <div 
                  key={idx} 
                  className="relative aspect-square rounded-lg border border-slate-200 overflow-hidden shadow-xs cursor-pointer hover:opacity-90 transition-opacity group"
                  onClick={() => setLightboxData({ images: initialRcaImages!, currentIndex: idx })}
                >
                  <Image src={img} alt={`RCA Image ${idx + 1}`} fill className="object-cover transition-transform group-hover:scale-105" />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="relative rounded-xl border border-emerald-100 bg-white p-2 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/5 transition-all">
          <textarea
            value={rcaText}
            onChange={(e) => setRcaText(e.target.value)}
            placeholder="Document the technical root cause and resolution steps here for internal audit..."
            className="w-full min-h-[160px] resize-none border-none bg-transparent p-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-0 outline-hidden"
          />
          
          {(rcaImages.length > 0 || rcaFiles.length > 0) && (
            <div className="flex flex-wrap gap-2 px-4 pb-4">
              {rcaImages.map((img, idx) => (
                 <div key={`exist-${idx}`} className="relative h-16 w-16 rounded-md border border-slate-200 overflow-hidden group">
                    <Image src={img} alt="Existing RCA" fill className="object-cover" />
                    <button 
                       onClick={() => setRcaImages(prev => prev.filter((_, i) => i !== idx))}
                       className="absolute top-1 right-1 bg-black/60 text-white rounded-full h-4 w-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                       <XCircle size={10} />
                    </button>
                 </div>
              ))}
              {rcaFiles.map((file, idx) => (
                 <div key={`new-${idx}`} className="relative h-16 w-16 rounded-md border border-slate-200 overflow-hidden group">
                    <Image src={URL.createObjectURL(file)} alt="New RCA" fill className="object-cover" />
                    <button 
                       onClick={() => setRcaFiles(prev => prev.filter((_, i) => i !== idx))}
                       className="absolute top-1 right-1 bg-black/60 text-white rounded-full h-4 w-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                       <XCircle size={10} />
                    </button>
                 </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between px-4 pb-2 pt-2 border-t border-slate-50">
            <div className="flex items-center gap-4">
              <p className="text-[10px] font-bold text-slate-400 italic">This information is only visible to the Samadhan Support Team.</p>
              <button 
                 type="button"
                 onClick={() => fileInputRef.current?.click()}
                 disabled={rcaImages.length + rcaFiles.length >= 10 || savingRca}
                 className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-600 disabled:opacity-50"
              >
                 <span className="material-symbols-outlined text-[16px]">image</span>
                 Attach Image
              </button>
              <input 
                 type="file" 
                 multiple 
                 accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                 className="hidden" 
                 ref={fileInputRef}
                 onChange={(e) => {
                   if (e.target.files) {
                      const newFiles = Array.from(e.target.files);
                      const totalAllowed = 10 - rcaImages.length - rcaFiles.length;
                      if (newFiles.length > totalAllowed) {
                        toast.error(`You can only attach ${totalAllowed} more image(s).`);
                        setRcaFiles(prev => [...prev, ...newFiles.slice(0, totalAllowed)]);
                      } else {
                        setRcaFiles(prev => [...prev, ...newFiles]);
                      }
                   }
                 }}
              />
            </div>
            <div className="flex items-center gap-2">
              {rca && (
                <button
                  type="button"
                  onClick={() => {
                     setIsEditingRca(false);
                     setRcaFiles([]);
                     setRcaImages(initialRcaImages || []);
                     setRcaText(rca || "");
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-95"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={savingRca || !rcaText.trim()}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-black text-white hover:bg-emerald-700 transition-all disabled:opacity-50"
              >
                {savingRca ? "Saving Report..." : rca ? "Save Changes" : "Submit RCA"}
                <CheckCircle2 size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {lightboxData && (
        <Lightbox
          images={lightboxData.images}
          initialIndex={lightboxData.currentIndex}
          onClose={() => setLightboxData(null)}
        />
      )}
    </div>
  );
}
