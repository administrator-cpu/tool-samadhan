"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useUICacheStore } from "@/store/useUICacheStore";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { User, Mail, Loader2, LogOut, Phone, Camera, X } from "lucide-react";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/lib/cropImage";
import Image from "next/image";

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, clearAuth } = useAuthStore();
  const { profileData, profileLastFetched, setProfileData } = useUICacheStore();
  
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Cropper states
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);

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

        // Update auth store user details so the Sidebar Navbar also updates
        const { setUser, user: currentUser } = useAuthStore.getState();
        if (response.data.user && currentUser) {
          setUser({
            ...currentUser,
            ...response.data.user,
          });
        }
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
    setIsCropping(true);
    setCrop({ x: 0, y: 0 });
    setZoom(1);

    if (e.target) e.target.value = '';
  };

  const onCropComplete = (_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropCancel = () => {
    setIsCropping(false);
    if (selectedImage) URL.revokeObjectURL(selectedImage);
    setSelectedImage(null);
  };

  const handleCropSave = async () => {
    if (!selectedImage || !croppedAreaPixels) return;

    setUploadingImage(true);
    try {
      const croppedImageBlob = await getCroppedImg(selectedImage, croppedAreaPixels);
      if (!croppedImageBlob) throw new Error("Failed to crop image");

      const file = new File([croppedImageBlob], "profile.jpeg", { type: "image/jpeg" });
      const formData = new FormData();
      formData.append("images", file);

      const res = await api.post("/users/profile/image", formData);
      
      const newProfileImage = res.data.user.profile_image;
      
      // Update cache state
      setProfileData({
        ...profileData!,
        user: { ...profileData!.user, profile_image: newProfileImage }
      });

      // Update auth store user details
      const { setUser } = useAuthStore.getState();
      if (profileData!.user) {
        setUser({ ...profileData!.user, profile_image: newProfileImage });
      }

      toast.success("Profile image updated");
      setIsCropping(false);
      setSelectedImage(null);
      URL.revokeObjectURL(selectedImage);
    } catch (err: any) {
      toast.error(err.message || "Failed to upload cropped image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    setUploadingImage(true);
    try {
      await api.delete("/users/profile/image");
      
      // Update cache state
      setProfileData({
        ...profileData!,
        user: { ...profileData!.user, profile_image: null }
      });

      // Update auth store user details
      const { setUser } = useAuthStore.getState();
      if (profileData!.user) {
        setUser({ ...profileData!.user, profile_image: undefined });
      }

      toast.success("Profile image removed");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove image");
    } finally {
      setUploadingImage(false);
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
  
  const canEditImage = isEditing || user.role === 'USER';

  return (
    <div className="min-h-screen bg-white pb-20 antialiased flex justify-center flex-col items-center">
      {/* Premium Header Banner */}
      <div className="h-64 w-full bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-300/30 to-transparent" />
        <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="mx-auto -mt-32 max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden">
          
          {/* Main Profile Section */}
          <div className="flex flex-col items-center px-8 py-12 text-center">
            
            {/* Avatar */}
            <div className="relative mb-6 group">
              <div className="relative flex h-42 w-42 items-center justify-center rounded-full bg-slate-50 text-indigo-600 ring-8 ring-white shadow-2xl overflow-hidden">
                {uploadingImage ? (
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                ) : user.profile_image ? (
                  <Image src={user.profile_image} alt="Profile Image" fill className="object-cover" />
                ) : (
                  <User size={56} strokeWidth={1.5} />
                )}

                {/* Hover Overlay */}
                {canEditImage && ( <label className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera size={24} />
                  <span className="mt-1 text-xs font-medium">Change</span>
                  <input 
                    type="file" 
                    accept="image/jpeg, image/png, image/webp, image/heic" 
                    className="hidden" 
                    onChange={handleImageSelect}
                    disabled={uploadingImage}
                  />
                </label>)}
              </div>

              {/* Remove Image Button */}
              {user.profile_image && !uploadingImage && canEditImage && (
                <button
                  onClick={handleRemoveImage}
                  className="absolute -top-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-white shadow-lg transition-transform hover:scale-110 hover:bg-red-500"
                  title="Remove photo"
                >
                  <X size={14} strokeWidth={3} />
                </button>
              )}

            </div>

            {/* Name & Role */}
            <div className="mb-10">
              <h2 className="text-3xl font-black tracking-tight text-slate-900">{user.name}</h2>
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className="rounded-full bg-emerald-50 px-3 mt-2 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 border border-emerald-200">
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
                className="min-w-[500px] space-y-6 text-left border-t border-slate-50 pt-10"
              >
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-hidden transition-all"
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
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-hidden transition-all"
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
              {!isEditing && user.role !== 'USER' && (
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
                className="group border border-red-200/50 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-red-100 text-sm font-bold text-red-600 transition-all hover:bg-red-200 active:scale-[0.98]"
              >
                <LogOut size={20} className="transition-transform group-hover:translate-x-1" />
                Log Out
              </button>
            </div>
          </div>

          {/* Bottom Banner */}
          {/* <div className="bg-slate-50/50 px-8 py-4 text-center border-t border-slate-50">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Samadhan Support System &copy; {new Date().getFullYear()}
            </p>
          </div> */}
        </div>
      </div>
      {/* Cropper Modal */}
      {isCropping && selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Crop Profile Photo</h3>
              <button onClick={handleCropCancel} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="relative w-full h-80 bg-slate-900">
              <Cropper
                image={selectedImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex justify-between">
                  <span>Zoom</span>
                  <span>{Math.round(zoom * 100)}%</span>
                </label>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.01}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#4b8264]"
                />
              </div>
              
              <div className="flex gap-4">
                <button 
                  onClick={handleCropCancel}
                  disabled={uploadingImage}
                  className="flex-1 h-12 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCropSave}
                  disabled={uploadingImage}
                  className="flex-1 h-12 rounded-xl bg-[#4b8264] text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {uploadingImage ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Photo"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileDetail({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm ">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-100 ">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
        <span className="text-sm font-bold text-slate-800 truncate max-w-[180px]">{value}</span>
      </div>
    </div>
  );
}
