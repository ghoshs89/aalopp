import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Puzzle Quest",
    short_name: "Puzzles",
    description: "Aishik's puzzle practice",
    start_url: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0e2018",
    theme_color: "#0e2018",
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
