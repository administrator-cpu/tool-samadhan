"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, Send, Paperclip, X } from "lucide-react";
import { useCategoryStore } from "@/store/useCategoryStore";
import Image from "next/image";

export default function SalesCreateTicketPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { categories, fetchCategories } = useCategoryStore();
  const [formData, setFormData] = useState({
    customerEmail: "",
    categoryId: "",
    description: "",
    circuitDescription: "",
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

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerEmail.trim()) {
      toast.error("Please enter customer email");
      return;
    }

    if (!formData.categoryId) {
      toast.error("Please select an issue category");
      return;
    }

    if (!formData.circuitDescription.trim()) {
      toast.error("Circuit description is required");
      return;
    }

    if (formData.circuitDescription.trim().length > 20) {
      toast.error("Circuit description cannot exceed 20 characters");
      return;
    }

    setLoading(true);

    try {
      const selectedCategory = categories.find(
        (c) => String(c.id) === String(formData.categoryId)
      );

      if (!selectedCategory) {
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
        formDataPayload.append("customerEmail", formData.customerEmail.trim());
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
          customerEmail: formData.customerEmail.trim(),
          message: formData.description,
          circuitDescription: formData.circuitDescription,
          issueCategoryId: selectedCategory.id,
          alternateEmail: alternateEmails.length ? alternateEmails : undefined
        });
      }
      
      toast.success("Ticket raised successfully for customer!");
      router.push("/employee/sales/tickets");
    } catch (err: any) {
      toast.error(err.message || "Failed to create ticket.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 antialiased font-sans">
      {/* Main */}
      <main className="flex flex-1 items-center justify-center w-full p-4 sm:p-6 md:p-12">
        <div className="w-full max-w-150 rounded-xl bg-white p-6 sm:p-10 md:p-12 border border-slate-100 shadow-2xl shadow-slate-200/40">
          
          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-[32px] font-black leading-tight text-slate-900 mb-2 font-heading">
              Raise Ticket
            </h1>
            <p className="text-base text-slate-500 font-medium">
              Create a support ticket on behalf of an existing customer.
            </p>
          </div>

          {/* Form */}
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>

            {/* Customer Email */}
            <div className="flex flex-col gap-2">
              <label htmlFor="customerEmail" className="text-sm font-bold text-slate-700">
                Customer Email Address
              </label>
              <input
                type="email"
                id="customerEmail"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleChange}
                placeholder="customer@example.com"
                required
                className="h-[56px] w-full rounded-lg border border-slate-200 bg-white px-4 text-base text-slate-900 placeholder:text-slate-400 transition-shadow focus:border-indigo-600 focus:outline-hidden focus:ring-4 focus:ring-indigo-600/5 font-medium"
              />
            </div>

            {/* Alternate Email */}
            <div className="flex flex-col gap-2">
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
                placeholder="secondary@example.com"
                className="h-[56px] w-full rounded-lg border border-slate-200 bg-white px-4 text-base text-slate-900 placeholder:text-slate-400 transition-shadow focus:border-indigo-600 focus:outline-hidden focus:ring-4 focus:ring-indigo-600/5 font-medium"
              />
            </div>

            {/* Circuit Description */}
            <div className="flex flex-col gap-2">
              <label htmlFor="circuitDescription" className="text-sm font-bold text-slate-700">
                Circuit Description
              </label>
              <input
                type="text"
                id="circuitDescription"
                name="circuitDescription"
                value={formData.circuitDescription}
                onChange={handleChange}
                placeholder="Circuit or B END ID"
                required
                className="h-[56px] w-full rounded-lg border border-slate-200 bg-white px-4 text-base text-slate-900 placeholder:text-slate-400 transition-shadow focus:border-indigo-600 focus:outline-hidden focus:ring-4 focus:ring-indigo-600/5 font-medium"
              />
            </div>
            
            {/* Category */}
            <div className="flex flex-col gap-2">
              <label htmlFor="categoryId" className="text-sm font-bold text-slate-700">
                Issue Category
              </label>
              <select
                id="categoryId"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className="h-[56px] w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 transition-shadow cursor-pointer focus:border-indigo-600 focus:outline-hidden focus:ring-4 focus:ring-indigo-600/5 font-medium"
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
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <label htmlFor="description" className="text-sm font-bold text-slate-700">
                Issue Description <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the problem details..."
                className="h-40 w-full resize-none rounded-lg border border-slate-200 bg-white p-4 text-base text-slate-900 placeholder:text-slate-400 transition-shadow focus:border-indigo-600 focus:outline-hidden focus:ring-4 focus:ring-indigo-600/5 font-medium"
              />
            </div>

            {/* Attachments */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-700">
                  Attachments <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading || attachments.length >= 10}
                  className="flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-700 disabled:opacity-50 transition-colors"
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
                disabled={loading}
                className="flex h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 text-white text-[15px] font-bold shadow-lg shadow-emerald-700/20 transition-all hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <span>Submit Request</span>
                    <Send size={16} />
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
