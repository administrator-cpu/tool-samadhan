"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useUICacheStore } from "@/store/useUICacheStore";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { User, Mail, Loader2, LogOut, Phone } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, clearAuth } = useAuthStore();
  const { profileData, profileLastFetched, setProfileData } = useUICacheStore();
  
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  useEffect(() => {
    if (profileData?.user) {
      setName(profileData.user.name);
      setPhone(profileData.user.phone || "");
    }
  }, [profileData]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    const fetchProfile = async () => {
      // 1-day expiry check (24 hours * 60 min * 60 sec * 1000 ms)
      const ONE_DAY = 24 * 60 * 60 * 1000;
      const isCacheValid = profileData && profileLastFetched && (Date.now() - profileLastFetched < ONE_DAY);

      if (isCacheValid) {
        console.log("[PROFILE] Using cached data");
        setLoading(false);
        return;
      }

      try {
        console.log("[PROFILE] Fetching from DB...");
        const response = await api.get("/users/me");
        setProfileData(response.data);
      } catch (error: any) {
        if (error.code === "SESSION_CLEARED_SILENT") return;
        toast.error("Failed to load profile details.");
        if (error.statusCode === 401) {
          clearAuth();
          router.push("/auth/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated, router, clearAuth, profileData, profileLastFetched, setProfileData]);

  const handleLogout = async () => {
    try {
      await api.post("/logout");
    } catch (err) {
      // Ignore logout error
    } finally {
      clearAuth();
      toast.success("Logged out successfully");
      router.push("/auth/login");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!profileData) return null;

  const { user, customer, employee } = profileData;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 antialiased">
      {/* Premium Header Banner */}
      <div className="h-64 w-full bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent" />
        <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="mx-auto -mt-32 max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl shadow-slate-200/50">
          
          {/* Main Profile Section */}
          <div className="flex flex-col items-center px-8 py-12 text-center">
            
            {/* Avatar */}
            <div className="relative mb-6">
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-slate-50 text-indigo-600 ring-8 ring-white shadow-xl">
                <User size={56} strokeWidth={1.5} />
              </div>
              <div className="absolute bottom-2 right-2 h-7 w-7 rounded-full border-4 border-white bg-emerald-500 shadow-sm" />
            </div>

            {/* Name & Role */}
            <div className="mb-10">
              <h2 className="text-3xl font-black tracking-tight text-slate-900">{user.name}</h2>
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-600 border border-indigo-100">
                  {user.role === 'USER' ? 'Customer' : user.role.replace('_', ' ')}
                </span>
              </div>
            </div>

            {isEditing ? (
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!name.trim()) {
                    toast.error("Name cannot be empty");
                    return;
                  }
                  if (phone) {
                    const phoneRegex = /^[0-9]{10}$/;
                    if (!phoneRegex.test(phone)) {
                      toast.error("Phone number must be exactly 10 digits");
                      return;
                    }
                  }
                  try {
                    setUpdatingProfile(true);
                    const res = await api.put("/users/profile", { name, phone: phone || null });
                    toast.success("Profile updated successfully");
                    
                    // Update cache state
                    setProfileData({
                      ...profileData,
                      user: {
                        ...profileData.user,
                        name,
                        phone,
                      }
                    });

                    // Update auth store user details
                    const { setUser } = useAuthStore.getState();
                    if (profileData.user) {
                      setUser({
                        ...profileData.user,
                        name,
                      });
                    }

                    setIsEditing(false);
                  } catch (err: any) {
                    toast.error(err.message || "Failed to update profile");
                  } finally {
                    setUpdatingProfile(false);
                  }
                }}
                className="w-full space-y-6 text-left border-t border-slate-50 pt-10"
              >
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-hidden transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^[0-9]*$/.test(val) && val.length <= 10) {
                        setPhone(val);
                      }
                    }}
                    placeholder="e.g. 1234567890"
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-hidden transition-all"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setName(profileData.user.name);
                      setPhone(profileData.user.phone || "");
                      setIsEditing(false);
                    }}
                    className="flex-1 h-12 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingProfile}
                    className="flex-1 h-12 rounded-lg bg-[#4b8264] text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-50 active:scale-[0.98] transition-all"
                  >
                    {updatingProfile ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : (
              <>
                {/* Account Information (Mixed) */}
                <div className="w-full space-y-6 border-t border-slate-50 pt-10">
                  <div className="grid grid-cols-1 gap-6 text-left sm:grid-cols-2">
                    <ProfileDetail 
                      icon={<Mail className="text-slate-400" size={18} />} 
                      label="Email Address" 
                      value={user.email} 
                    />
                    <ProfileDetail 
                      icon={<Phone className="text-slate-400" size={18} />} 
                      label="Phone No." 
                      value={user.phone || "Not provided"} 
                    />
                  </div>
                </div>
              </>
            )}
 
            {/* Actions */}
            <div className="mt-12 flex w-full flex-col gap-4">
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#4b8264] text-sm font-black text-white hover:bg-emerald-700 transition-all active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-sm font-bold">edit</span>
                  Edit Profile
                </button>
              )}
              <button 
                onClick={handleLogout}
                className="group flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-red-100 text-sm font-bold text-red-600 transition-all hover:bg-red-200 active:scale-[0.98]"
              >
                <LogOut size={20} className="transition-transform group-hover:translate-x-1" />
                Log Out
              </button>
            </div>
          </div>

          {/* Bottom Banner */}
          <div className="bg-slate-50/50 px-8 py-4 text-center border-t border-slate-50">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Samadhan Support System &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileDetail({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
        <span className="text-sm font-bold text-slate-800 truncate max-w-[180px]">{value}</span>
      </div>
    </div>
  );
}
