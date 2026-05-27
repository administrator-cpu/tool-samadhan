"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";

interface LightboxProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

export default function Lightbox({ images, initialIndex, onClose }: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      } else if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [images.length, onClose]);

  const handleShare = async () => {
    const currentImageUrl = images[currentIndex];
    let shareUrl = currentImageUrl;

    if (typeof window !== "undefined") {
      try {
        const urlObj = new URL(currentImageUrl);
        // If it's a Cloudinary URL, extract just the filename
        if (urlObj.hostname.includes("cloudinary.com")) {
          const pathParts = urlObj.pathname.split("/");
          const filename = pathParts[pathParts.length - 1];
          shareUrl = `${window.location.origin}/share/image/${filename}`;
        } else {
          // Fallback for non-cloudinary external URLs
          shareUrl = currentImageUrl;
        }
      } catch (e) {
        // Fallback for relative or malformed URLs
        if (
          !currentImageUrl.startsWith("http://") &&
          !currentImageUrl.startsWith("https://") &&
          !currentImageUrl.startsWith("data:")
        ) {
          shareUrl = `${window.location.origin}${currentImageUrl.startsWith("/") ? "" : "/"}${currentImageUrl}`;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Public share link copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy link to clipboard");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative max-w-7xl w-full h-full flex items-center justify-center animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Control buttons grouped inside a flex layout in top right */}
        <div className="absolute top-4 right-4 md:top-8 md:right-8 flex items-center gap-3 z-10">
          <button
            className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all cursor-pointer border-none shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
            onClick={handleShare}
            title="Share Image Publicly"
            type="button"
          >
            <span className="material-symbols-outlined drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">share</span>
          </button>
          <button
            className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all cursor-pointer border-none shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
            onClick={onClose}
            title="Close"
            type="button"
          >
            <span className="material-symbols-outlined drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">close</span>
          </button>
        </div>

        {/* Left navigation arrow */}
        {images.length > 1 && (
          <button
            className="absolute left-4 md:left-8 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all z-10 cursor-pointer border-none shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
            onClick={() => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)}
            type="button"
          >
            <span className="material-symbols-outlined drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">chevron_left</span>
          </button>
        )}

        {/* Display Image */}
        <div className="relative w-[90vw] h-[85vh] flex items-center justify-center">
          <Image
            src={images[currentIndex]}
            alt={`Enlarged image ${currentIndex + 1}`}
            fill
            className="object-contain"
            sizes="100vw"
            quality={100}
            priority
          />
        </div>

        {/* Right navigation arrow */}
        {images.length > 1 && (
          <button
            className="absolute right-4 md:right-8 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all z-10 cursor-pointer border-none shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
            onClick={() => setCurrentIndex((prev) => (prev + 1) % images.length)}
            type="button"
          >
            <span className="material-symbols-outlined drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">chevron_right</span>
          </button>
        )}

        {/* Bottom index indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  );
}
