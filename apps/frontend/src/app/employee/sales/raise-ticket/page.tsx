"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, Send } from "lucide-react";

interface Category {
  id: number;
  name: string;
}

export default function SalesCreateTicketPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    customerEmail: "",
    categoryId: "",
    description: "",
    circuitDescription: "",
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/categories");
        setCategories(res.data || []);
      } catch (err) {
        toast.error("Failed to load categories");
      }
    };
    fetchCategories();
  }, []);

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

    setLoading(true);

    try {
      const selectedCategory = categories.find(
        (c) => String(c.id) === String(formData.categoryId)
      );

      if (!selectedCategory) {
        toast.error("Invalid category selected");
        return;
      }

      await api.post("/tickets", {
        customerEmail: formData.customerEmail.trim(),
        message: formData.description,
        circuitDescription: formData.circuitDescription,
        issueCategoryId: selectedCategory.id,
      });
      
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
        <div className="w-full max-w-[600px] rounded-xl bg-white p-6 sm:p-10 md:p-12 border border-slate-100 shadow-2xl shadow-slate-200/40">
          
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
                className="h-[160px] w-full resize-none rounded-lg border border-slate-200 bg-white p-4 text-base text-slate-900 placeholder:text-slate-400 transition-shadow focus:border-indigo-600 focus:outline-hidden focus:ring-4 focus:ring-indigo-600/5 font-medium"
              />
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
