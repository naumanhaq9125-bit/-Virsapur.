export const siteSettings = {
  id: "virsapur-site",
  name: "Virsapur",
  tagline: "Pakistan’s heritage, made accessible.",
  purpose: "We aim to revive our diverse cultural heritage through spreading awareness and advocating for its preservation.",
  email: "virsapur@gmail.com",
  phone: "+92-315-4354899",
  address: null,
  defaultSiteOrigin: "https://virsapur-frontend.vercel.app",
  defaultSeoImage: {
    src: "assets/hero-badshahi.jpg",
    optimizedStem: "hero-badshahi",
    width: 1918,
    height: 1080,
    alt: "Badshahi Mosque and Lahore"
  },
  navigation: [
    { id: "home", label: "Home", route: "/" },
    { id: "map", label: "Explore", route: "/heritage-map" },
    { id: "programmes", label: "Experiences", route: "/programmes" },
    { id: "archives", label: "Stories", route: "/archives" },
    { id: "work", label: "Our work", route: "/service/research-and-restoration-projects" },
    { id: "about", label: "About", route: "/why-virsapur" }
  ],
  footer: {
    explore: ["map", "programmes", "archives", "work", "about"],
    connect: [{ label: "Contact", route: "/contact" }],
    legal: []
  },
  social: [],
  integrations: {
    contact: { connected: false, endpoint: null, method: "POST" },
    newsletter: { connected: false, endpoint: null },
    authentication: { enabled: false }
  }
};

export const publicationStates = ["draft", "review", "published", "archived"];
