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

    // Convert Cloudinary URL to proxied frontend URL if it matches Cloudinary domains
    // e.g. https://res.cloudinary.com/dpmvyp1vc/image/upload/v1779811665/samadhan_tickets/vijaysingh-10046-1779811664476.png
    // into http://frontend_url/image/samadhan_tickets/vijaysingh-10046-1779811664476.png
    if (currentImageUrl.includes("res.cloudinary.com")) {
      try {
        const urlObj = new URL(currentImageUrl);
        const pathSegments = urlObj.pathname.split("/");
        
        // Find the index of "upload"
        const uploadIndex = pathSegments.indexOf("upload");
        if (uploadIndex !== -1) {
          let imagePathSegments = pathSegments.slice(uploadIndex + 1);
          // Skip the version number segment (e.g., v1779811665) if present
          if (imagePathSegments[0] && /^v\d+$/.test(imagePathSegments[0])) {
            imagePathSegments = imagePathSegments.slice(1);
          }
          const imagePath = imagePathSegments.join("/");
          if (typeof window !== "undefined") {
            shareUrl = `${window.location.origin}/image/${imagePath}`;
          }
        }
      } catch (e) {
        console.error("Failed to parse Cloudinary URL", e);
      }
    } else {
      // Resolve relative URL to absolute URL for other images
      if (typeof window !== "undefined") {
        if (
          !currentImageUrl.startsWith("http://") &&
          !currentImageUrl.startsWith("https://") &&
          !currentImageUrl.startsWith("data:")
        ) {
          shareUrl = `${window.location.origin}${currentImageUrl}`;
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
            className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer border-none"
            onClick={handleShare}
            title="Share Image Publicly"
            type="button"
          >
            <span className="material-symbols-outlined">share</span>
          </button>
          <button
            className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer border-none"
            onClick={onClose}
            title="Close"
            type="button"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Left navigation arrow */}
        {images.length > 1 && (
          <button
            className="absolute left-4 md:left-8 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors z-10 cursor-pointer border-none"
            onClick={() => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)}
            type="button"
          >
            <span className="material-symbols-outlined">chevron_left</span>
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
            className="absolute right-4 md:right-8 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors z-10 cursor-pointer border-none"
            onClick={() => setCurrentIndex((prev) => (prev + 1) % images.length)}
            type="button"
          >
            <span className="material-symbols-outlined">chevron_right</span>
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
