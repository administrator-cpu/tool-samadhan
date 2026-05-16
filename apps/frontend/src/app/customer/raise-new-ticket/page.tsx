"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Category {
  id: number;
  name: string;
}

export default function CreateTicketPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    categoryId: "",
    description: "",
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/categories");
        setCategories(res.data);
      } catch (err) {
        toast.error("Failed to load categories");
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId || !formData.description) {
      toast.error("Please fill in all fields");
      return;
    }

    if (formData.description.length < 10) {
      toast.error(`Please provide more detail. Minimum 10 characters required (currently ${formData.description.length})`);
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

      await api.post("/tickets", {
        message: formData.description,
        issueCategoryId: selectedCategory.id,
      });
      
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
      <header className="w-full px-6 py-6 sm:px-8">
        <Link
          href="/customer"
          className="group inline-flex items-center gap-2 text-slate-500 transition-colors hover:text-slate-800"
        >
          <span className="material-symbols-outlined text-[20px] transition-transform group-hover:-translate-x-1">
            arrow_back
          </span>
          <span className="text-sm font-medium">Back to Dashboard</span>
        </Link>
      </header>

      {/* Main */}
      <main className="flex flex-1 items-center justify-center w-full p-4 sm:p-6 md:p-12">
        <div className="w-full max-w-[600px] rounded-xl bg-white p-6 sm:p-10 md:p-12 sm:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)]">
          
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
                  className="h-[56px] w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 transition-shadow cursor-pointer focus:border-[#2513ec] focus:outline-none focus:ring-[3px] focus:ring-[#2513ec]/10"
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

            {/* Description */}
            <div className="flex flex-col gap-2">
              <label htmlFor="description" className="text-sm font-medium text-slate-700">
                Issue Description
              </label>

              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Tell us exactly what's happening. Include light colors on your router if possible."
                className="h-[160px] w-full resize-none rounded-lg border border-slate-200 bg-white p-4 text-base text-slate-900 placeholder:text-slate-400 transition-shadow focus:border-[#2513ec] focus:outline-none focus:ring-[3px] focus:ring-[#2513ec]/10"
              />
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 text-white text-[15px] font-medium shadow-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <span>Submit Request</span>
                    <span className="material-symbols-outlined text-[18px]">
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