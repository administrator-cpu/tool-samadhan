"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { Loader2, Ticket, CheckCircle2, ChevronDown, Paperclip, X } from "lucide-react";
import Image from "next/image";

export default function GuestRaiseTicketPage() {
  const router = useRouter();
  const { isAuthenticated, user, _hasHydrated, clearAuth, getDashboardPath } = useAuthStore();
  
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  
  const [formData, setFormData] = useState({
    circuitId: "",
    customerName: "",
    contactPhone: "",
    categoryId: "",
    description: "",
    alternateEmail: "",
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (_hasHydrated) {
      if (!isAuthenticated) {
        router.replace("/guest/login");
        return;
      }
      if (user?.role !== "GUEST") {
        router.replace(getDashboardPath());
        return;
      }

      const storedCircuitId = sessionStorage.getItem("guest_circuitId");
      const storedCustomerName = sessionStorage.getItem("guest_customerName");
      
      if (!storedCircuitId || !storedCustomerName) {
        router.replace("/guest/verify-circuit");
        return;
      }

      setFormData(prev => ({
        ...prev,
        circuitId: storedCircuitId,
        customerName: storedCustomerName
      }));

      // Fetch Categories
      api.get("/categories").then(res => {
        setCategories(res.data || []);
        if (res.data && res.data.length > 0) {
          setFormData(prev => ({ ...prev, categoryId: res.data[0].id }));
        }
      }).catch(err => {
        console.error("Failed to load categories", err);
      });
    }
  }, [isAuthenticated, user, _hasHydrated, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const validFiles: File[] = [];

      for (const file of selectedFiles) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not a valid image format.`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} exceeds the 5MB size limit.`);
          continue;
        }
        validFiles.push(file);
      }

      if (attachments.length + validFiles.length > 10) {
        toast.error("You can only upload up to 10 images.");
        setAttachments((prev) => [...prev, ...validFiles].slice(0, 10));
      } else {
        setAttachments((prev) => [...prev, ...validFiles]);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.contactPhone.trim() || !formData.categoryId) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    const numericPhone = formData.contactPhone.replace(/\D/g, "");
    if (numericPhone.length < 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    
    const alternateEmails = formData.alternateEmail.split(",").map((email) => email.trim()).filter(Boolean);
    if (alternateEmails.length > 2) {
      toast.error("You can enter a maximum of 2 alternate email addresses.");
      return;
    }

    setIsLoading(true);
    try {
      if (attachments.length > 0) {
        const formDataPayload = new FormData();
        formDataPayload.append("circuitId", formData.circuitId);
        formDataPayload.append("customerName", formData.customerName);
        formDataPayload.append("contactPhone", formData.contactPhone);
        formDataPayload.append("categoryId", formData.categoryId);
        if (formData.description) {
          formDataPayload.append("description", formData.description);
        }
        if (alternateEmails.length > 0) {
          formDataPayload.append("alternateEmail", JSON.stringify(alternateEmails));
        }
        attachments.forEach((file) => {
          formDataPayload.append("files", file);
        });

        await api.post("/guest/tickets", formDataPayload);
      } else {
        await api.post("/guest/tickets", {
          circuitId: formData.circuitId,
          customerName: formData.customerName,
          contactPhone: formData.contactPhone,
          categoryId: formData.categoryId,
          description: formData.description || undefined,
          alternateEmail: alternateEmails.length ? alternateEmails : undefined
        });
      }

      toast.success("Ticket raised successfully!");
      setIsSuccess(true);
      
      // Clear session data
      sessionStorage.removeItem("guest_circuitId");
      sessionStorage.removeItem("guest_customerName");
      
      // Clear auth so the guest session is expired properly
      clearAuth();
    } catch (error: any) {
      toast.error(error.message || "Failed to raise ticket. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (!_hasHydrated) return null;

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#f6f6f8] flex items-center justify-center p-6">
        <div className="w-full max-w-[440px] rounded-3xl border border-slate-200/70 bg-white p-10 text-center shadow-[0_10px_40px_-10px_rgba(42,20,180,0.08)]">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-slate-900">Ticket Raised!</h2>
          <p className="text-slate-500 mb-8">
            We have received your issue and our support team will contact you shortly on the provided phone number. You will also receive updates on your email.
          </p>
          <button
            onClick={() => router.push("/guest/login")}
            className="w-full rounded-lg border border-slate-200 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f6f8] flex flex-col text-slate-900 antialiased font-sans">
      <main className="flex flex-1 items-center justify-center w-full p-4 sm:p-6 md:p-6">
        <div className="w-full max-w-2xl rounded-xl bg-white p-6 sm:p-10 md:px-12 md:py-10 sm:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] border border-slate-200/70">
          
          <div className="mb-8 flex items-center gap-4 border-b border-slate-100 pb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Ticket className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-heading">
                Raise Support Ticket
              </h1>
              <p className="text-sm text-slate-500 font-body">
                Please provide details about your issue
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            {/* Grid for Circuit & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700">Circuit ID</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.circuitId}
                    disabled
                    className="h-12 w-full appearance-none rounded-lg border border-slate-200 bg-slate-100 px-4 text-base text-slate-500 shadow-sm cursor-not-allowed focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="contactPhone" className="text-sm font-medium text-slate-700">Phone Number <span className="text-red-500">*</span></label>
                <input
                  id="contactPhone"
                  name="contactPhone"
                  type="tel"
                  required
                  value={formData.contactPhone}
                  onChange={handleChange}
                  placeholder="9953637300"
                  className="h-12 w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 text-base text-slate-900 placeholder:text-slate-400 transition-shadow focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="categoryId" className="text-sm font-medium text-slate-700">Issue Category <span className="text-red-500">*</span></label>
              <div className="relative">
                <select
                  id="categoryId"
                  name="categoryId"
                  required
                  value={formData.categoryId}
                  onChange={handleChange}
                  className="h-12 w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 transition-shadow cursor-pointer focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option value="" disabled>Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                  <span className="material-symbols-outlined">
                    keyboard_arrow_down
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="alternateEmail" className="text-sm font-medium text-slate-700">
                Alternate Email <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <p className="text-xs font-normal text-slate-400 -mt-1">
                Enter up to 2 email addresses separated by commas.
              </p>
              <input
                type="email"
                id="alternateEmail"
                name="alternateEmail"
                multiple
                value={formData.alternateEmail}
                onChange={handleChange}
                placeholder="user1@eg.com, user2@eg.com"
                className="h-12 w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 text-base text-slate-900 placeholder:text-slate-400 transition-shadow focus:border-primary focus:ring-1 focus:ring-primary outline-none focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="description" className="text-sm font-medium text-slate-700">
                Issue Description <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Please describe the issue in detail..."
                className="h-40 w-full resize-none appearance-none rounded-lg border border-slate-200 bg-white p-4 text-base text-slate-900 placeholder:text-slate-400 transition-shadow focus:border-primary focus:ring-1 focus:ring-primary outline-none focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-2 -mt-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">
                  Attachments <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || attachments.length >= 10}
                  className="p-2 flex items-center gap-1.5 text-sm font-medium text-primary hover:text-[#cc3e0b] disabled:opacity-50 transition-colors"
                >
                  <Paperclip size={16} />
                  Add Images
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg, image/png, image/webp, image/heic, image/heif"
                  multiple
                  className="hidden"
                />
              </div>
              
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-2">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 w-20 h-20 shadow-sm">
                      <Image
                        src={URL.createObjectURL(file)}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        disabled={isLoading}
                        className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full hover:bg-red-500 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center justify-center gap-2 rounded-lg bg-brand-gradient px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-ember/20 transition duration-200 hover:bg-brand-gradient-hover active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Ticket"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
