import Hero from "./components/Hero";
import CategorySection from "./components/CategorySection";
import FeaturedListings from "./components/FeaturedListings";
import HowItWorks from "./components/HowItWorks";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main>
      <Hero />
      <CategorySection />
      <FeaturedListings />
      <HowItWorks />
    </main>
  );
}