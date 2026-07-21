"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useCategoryStore } from "@/store/useCategoryStore";
import Image from "next/image";
import { Paperclip, X, ChevronDown } from "lucide-react";
import { useConnectionStore } from "@/store/useCircuitIDStore";


export default function CreateTicketPage() {
  const { connections, loadingConnection, hasFetched, connectionError, fetchConnections } = useConnectionStore();


  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { categories, fetchCategories } = useCategoryStore();
  const searchParams = useSearchParams();
  const circuitIdParam = searchParams.get("circuitId");

  const [formData, setFormData] = useState({
    categoryId: "",
    description: "",
    circuitDescription: circuitIdParam || "",
    alternateEmail: "",
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);
  
  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  useEffect(() => {
    if ( hasFetched && !connectionError && connections.length === 0 ) {
      toast.error("No active circuits found for your account. Please contact support if you believe this is incorrect.");
    }
  }, [hasFetched, connectionError, connections]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.circuitDescription.trim()) {
      toast.error("Circuit description is required");
      return;
    }

    if (formData.circuitDescription.trim().length > 20) {
      toast.error("Circuit description cannot exceed 20 characters");
      return;
    }
    
    if (!formData.categoryId) {
      toast.error("Please select an issue category");
      return;
    }

    setLoading(true);

    try {
      const selectedCategory = categories.find(
        (c) => String(c.id) === String(formData.categoryId)
      );

      if (!selectedCategory) {
        console.error("Category lookup failed:", {
          searchedId: formData.categoryId,
          availableCategories: categories,
        });
        toast.error("Invalid category selected");
        return;
      }

      const alternateEmails = formData.alternateEmail.split(",").map((email) => email.trim()).filter(Boolean);
      if (alternateEmails.length > 3) {
        toast.error("You can enter a maximum of 3 alternate email addresses.");
        return;
      }

      if (attachments.length > 0) {
        const formDataPayload = new FormData();
        formDataPayload.append("message", formData.description);
        formDataPayload.append("circuitDescription", formData.circuitDescription);
        formDataPayload.append("issueCategoryId", String(selectedCategory.id));
        if (alternateEmails.length > 0) {
          formDataPayload.append( "alternateEmail", JSON.stringify(alternateEmails));
        }
        attachments.forEach((file) => {
          formDataPayload.append("files", file);
        });

        await api.post("/tickets", formDataPayload);
      } else {
        await api.post("/tickets", {
          message: formData.description,
          circuitDescription: formData.circuitDescription,
          issueCategoryId: selectedCategory.id,
          alternateEmail: alternateEmails.length ? alternateEmails : undefined
        });
      }
      
      toast.success("Ticket raised successfully!");
      router.push("/customer/tickets");
    } catch (err: any) {
      toast.error(err.message || "Failed to create ticket.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f6f8] text-slate-900 antialiased font-sans">
      
      {/* Header */}
      {/* <header className="w-full px-6 py-6 sm:px-8">
        <Link
          href="/customer"
          className="group inline-flex items-center gap-2 text-slate-500 transition-colors hover:text-slate-800"
        >
          <span className="material-symbols-outlined text-[20px] transition-transform group-hover:-translate-x-1">
            arrow_back
          </span>
          <span className="text-sm font-medium">Back to Dashboard</span>
        </Link>
      </header> */}

      {/* Main */}
      <main className="flex flex-1 items-center justify-center w-full p-4 sm:p-6 md:p-6">
        <div className="w-full max-w-150 rounded-xl bg-white p-6 sm:p-10 md:px-12 md:py-8 sm:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)]">
          
          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-[32px] font-semibold leading-tight text-slate-900 mb-2">
              How can we help today?
            </h1>
            <p className="text-base text-slate-500">
              Fill out the form below and we'll get right on it.
            </p>
          </div>

          {/* Form */}
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>

            {/* Circuit Description */}
            
           <div className="flex flex-col gap-2">
              <label htmlFor="circuitDescription" className="text-sm font-medium text-slate-700">
                Circuit Description
             </label>

              <div className="relative">
                <select
                  name="circuitDescription"
                  value={formData.circuitDescription}
                  onChange={handleChange}
                  disabled={loadingConnection || !!connectionError || connections.length === 0}
                  className="h-12 w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 pr-12 text-base text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none"

                >
                  {loadingConnection ? (
                    <option>Loading circuits...</option>
                  ) : connectionError ? (
                    <option>Failed to load circuits</option>
                  ) : connections.length === 0 ? (
                    <option>No circuits available</option>
                  ) : (
                    <>
                      <option value="" disabled>Select Circuit ID</option>
                
                      {connections.map((conn) => (
                        <option key={conn.id} value={conn.fabCircuitId}>
                          {conn.opportunityId}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              
                <ChevronDown
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={20}
                />
              </div>
            </div>


       
            
            {/* Category */}
            <div className="flex flex-col gap-2">
              <label htmlFor="categoryId" className="text-sm font-medium text-slate-700">
                Issue Category
              </label>

              <div className="relative">
                <select
                  id="categoryId"
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  disabled={ connections.length === 0 || loadingConnection}
                  className="h-12 w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 transition-shadow cursor-pointer focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="" disabled>
                    Select an issue type
                  </option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>

                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                  <span className="material-symbols-outlined">
                    keyboard_arrow_down
                  </span>
                </div>
              </div>
            </div>


            {/* Alternate Email */}
            <div className="flex flex-col gap-2">
              {/*<label htmlFor="alternateEmail" className="text-sm font-medium text-slate-700">
                Alternate Email <span className="text-slate-400 font-normal">(Optional)</span>
              </label>*/}

              <label htmlFor="alternateEmail" className="text-sm font-medium text-slate-700">
                Alternate Email <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              
              <p className="text-xs font-normal text-slate-400 -mt-1">
                Enter up to 3 email addresses separated by commas.
              </p>
              <input
                type="email"
                id="alternateEmail"
                name="alternateEmail"
                multiple
                value={formData.alternateEmail}
                onChange={handleChange}
                disabled={ connections.length === 0 || loadingConnection}
                placeholder="user1@eg.com, user2@eg.com, user3@eg.com"
                className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-base text-slate-900 placeholder:text-slate-400 transition-shadow focus:border-emerald-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>


            {/* Description */}
            <div className="flex flex-col gap-2">
              <label htmlFor="description" className="text-sm font-medium text-slate-700">
                Issue Description <span className="text-slate-400 font-normal">(Optional)</span>
              </label>

              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                disabled={ connections.length === 0 || loadingConnection}
                placeholder="Tell us exactly what's happening..."
                className="h-40 w-full resize-none rounded-lg border border-slate-200 bg-white p-4 text-base text-slate-900 placeholder:text-slate-400 transition-shadow focus:border-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none"
              />
            </div>

            {/* Attachments */}
            <div className="flex flex-col gap-2 -mt-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">
                  Attachments <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading || attachments.length >= 10 || connections.length === 0 || loadingConnection}
                  className="p-2 flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-500/80 disabled:opacity-50 transition-colors"
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
                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 w-20 h-20 shadow-xs">
                      <Image
                        src={URL.createObjectURL(file)}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        disabled={loading}
                        className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full hover:bg-red-500 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || connections.length === 0 || loadingConnection}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 text-white text-[15px] font-medium shadow-sm transition-all hover:opacity-90 disabled:opacity-50  disabled:cursor-not-allowed enabled:hover:cursor-pointer"
              >
                {loading ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <span>Submit Request</span>
                    <span className="material-symbols-outlined text-[18px] hover:translate-x-1 transition-transform duration-200">
                      arrow_forward
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        
      </main>
    </div>
  );
}