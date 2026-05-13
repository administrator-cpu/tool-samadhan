import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "Samadhan | Instant Support & Issue Resolution Hub",
  description: "Experience the fastest support resolution with Samadhan. Report technical issues in under 30 seconds and track real-time progress on your dashboard. Zero-confusion, high-accountability support.",
  keywords: ["support system", "issue tracking", "technical support", "SLA management", "Samadhan dashboard", "customer service hub"],
  openGraph: {
    title: "Samadhan | Instant Support Resolution Hub",
    description: "Get your technical issues resolved instantly. Transparent progress and real-time tracking for every ticket.",
    type: "website",
    locale: "en_IN",
    siteName: "Samadhan Support",
    images: [
      {
        url: "/opengraph-image.webp",
        width: 1200,
        height: 630,
        alt: "Samadhan Support Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Samadhan | Instant Support Resolution",
    description: "Report technical issues in 30 seconds. Track live updates on your dashboard.",
    images: ["/twitter-image.webp"],
  },
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return <HomeClient />;
}