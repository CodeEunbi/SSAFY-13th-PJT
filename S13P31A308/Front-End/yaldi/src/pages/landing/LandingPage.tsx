import { useState, useEffect } from 'react';
import Hero from './components/Hero';
import PainPoints from './components/PainPoints';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import Demo from './components/Demo';
import Footer from './components/Footer';

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-white min-h-screen">
      <Hero scrollY={scrollY} />
      <PainPoints />
      <Features />
      <HowItWorks />
      <Demo />
      <Footer />
    </div>
  );
}
