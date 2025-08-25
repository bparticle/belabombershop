const description =
  "Official Bela Bomberman merchandise store. High-quality apparel and accessories featuring the iconic Bomberman brand.";
const title = "Bela Bomberman Store";
const url = "https://belabomberman.com";

const seo = {
  title,
  titleTemplate: "%s | Bela Bomberman",
  description,
  openGraph: {
    description,
    title,
    type: "website",
    url,
  },
  twitter: {
    handle: "@belabomberman",
    site: "@belabomberman",
  },
};

export { seo as defaultSEO, url as defaultUrl };
