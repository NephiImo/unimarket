import Hero from "./components/Hero";
import Navbar from "./components/Navbar";
import CategorySection from "./components/CategorySection";
import FeaturedListings from "./components/FeaturedListings";
import HowItWorks from "./components/HowItWorks";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <CategorySection/>
        <FeaturedListings/>
        <HowItWorks/>
      </main>
      <Footer/>
    </>
  );
}