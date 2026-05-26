import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  try {
    // In Next.js 15+ / 16+, params is a Promise and must be awaited.
    // To support both synchronous and asynchronous params definitions safely:
    const resolvedParams = params instanceof Promise ? await params : params;
    const imagePath = resolvedParams?.path?.join("/");

    if (!imagePath) {
      return new NextResponse("Image path is required", { status: 400 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "dpmvyp1vc";
    const cloudinaryUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${imagePath}`;

    // Fetch the image from Cloudinary server-side
    const response = await fetch(cloudinaryUrl, {
      method: "GET",
      headers: {
        "Accept": "image/*",
      },
    });

    if (!response.ok) {
      return new NextResponse("Failed to fetch image from storage provider", {
        status: response.status,
      });
    }

    // Read response content and content-type
    const contentType = response.headers.get("content-type") || "image/png";
    const imageBuffer = await response.arrayBuffer();

    // Serve the image directly
    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    console.error("Error proxying image:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
