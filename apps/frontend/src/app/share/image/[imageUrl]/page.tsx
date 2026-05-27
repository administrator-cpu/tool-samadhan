import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Image as ImageIcon, ArrowLeft } from "lucide-react";

interface ShareImagePageProps {
  params: Promise<{
    imageUrl: string;
  }>;
}

export default async function ShareImagePage({ params }: ShareImagePageProps) {
  const resolvedParams = await params;
  const { imageUrl } = resolvedParams;

  if (!imageUrl) {
    return notFound();
  }

  // Ensure there's no path traversal or strange URL characters
  const cleanImageUrl = encodeURIComponent(decodeURIComponent(imageUrl));
  
  // The base Cloudinary URL requested by the user
  const baseUrl = "https://res.cloudinary.com/dpmvyp1vc/image/upload/v1779855322/samadhan_tickets";
  const fullUrl = `${baseUrl}/${cleanImageUrl}`;

  // Check if image actually exists on Cloudinary
  try {
    const res = await fetch(fullUrl, { method: "HEAD", cache: "no-store" });
    if (!res.ok) {
      return <ImageNotFoundUI />;
    }
  } catch (error) {
    return <ImageNotFoundUI />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 w-full overflow-hidden">
      <div className="relative w-full h-screen">
        <Image
          src={fullUrl}
          alt="Shared Image"
          fill
          className="object-contain"
          quality={100}
          priority
          sizes="100vw"
        />
      </div>
    </div>
  );
}

function ImageNotFoundUI() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-white w-full p-4 overflow-hidden">
      <div className="relative z-10 overflow-hidden max-w-md w-full bg-white/80 backdrop-blur-xl rounded-3xl p-10 text-center shadow-2xl shadow-slate-200/50 border border-slate-100/70 flex flex-col items-center">
        <ImageIcon className="absolute -right-8 -bottom-8 text-slate-50 -rotate-12 z-0" size={240} strokeWidth={1} />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="h-24 w-24 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-6">
            <AlertCircle size={48} />
          </div>
          
          <h1 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Image Not Found</h1>
          <p className="text-slate-500 font-medium leading-relaxed">
            The image you are looking for has been removed, expired, or the link is incorrect.
          </p>
        </div>
      </div>
    </div>
  );
}
