import Link from 'next/link';
import StarDrift from '@/components/landing/StarDrift';
import FadeIn from '@/components/landing/FadeIn';
import HeroParallax from '@/components/landing/HeroParallax';

export default function LandingPage() {
  const capabilities = [
    {
      id: 'I',
      title: 'Complete Planetary Topology',
      description: 'A comprehensive mapping of all eight major planets, Earth’s moon, and the central star. Constructed using high-resolution textures and accurate dimensional scaling.',
      details: '8 Major Planets — 1 Terrestrial Moon — Sun',
    },
    {
      id: 'II',
      title: 'Real-Time Orbital Mechanics',
      description: 'Observe true elliptical trajectories. All celestial bodies adhere to their relative orbital velocities and distances, presenting a scientifically grounded view of our local system.',
      details: 'Computed Trajectories — Scaled Distances',
    },
    {
      id: 'III',
      title: 'Cinematic Target Tracking',
      description: 'Seamless camera transitions allow you to focus on any specific body. The viewport automatically locks onto and tracks the target through its continuous path across the void.',
      details: 'Focus Interpolation — Auto-Tracking',
    },
    {
      id: 'IV',
      title: 'Temporal Acceleration',
      description: 'Command the flow of time. Accelerate the simulation to observe macro orbital mechanics unfold rapidly, or pause to study specific planetary alignments.',
      details: 'Up to 5.0x Speed — Precision Pause Control',
    },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-orange-600 selection:text-white font-sans overflow-x-hidden">
      
      {/* Restrained Ambient Star Particles */}
      <StarDrift />
      
      {/* Navigation Header */}
      <nav className="relative z-20 flex justify-between items-center px-6 md:px-12 py-8 border-b border-slate-800/50">
        <div className="font-serif text-lg tracking-wide text-slate-300">
          Solar System <span className="italic text-slate-500">Observatory</span>
        </div>
        <Link 
          href="/explore"
          className="px-6 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-700 hover:border-slate-500 text-sm font-medium transition-[background-color,border-color,transform] duration-200 ease-out hover:scale-105"
        >
          Enter Simulation
        </Link>
      </nav>

      {/* Hero Section with Parallax Drift */}
      <main className="relative z-10 px-6 md:px-12 pt-32 pb-40">
        <div className="max-w-screen-2xl mx-auto">
          <HeroParallax speed={0.12}>
            <FadeIn delay={50}>
              <h1 className="font-serif text-6xl md:text-8xl lg:text-[10vw] leading-[0.9] tracking-tight mb-16 text-slate-100">
                Discover the <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-orange-400 italic">Scale of Space</span>
              </h1>
            </FadeIn>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mt-24">
              <div className="md:col-span-8 lg:col-span-6">
                <FadeIn delay={200}>
                  <p className="text-xl md:text-3xl font-light text-slate-300 leading-relaxed">
                    A physically accurate, interactive 3D model of our solar system. 
                    Experience celestial scale, orbital mechanics, and planetary motion directly in your browser.
                  </p>
                </FadeIn>
              </div>
              
              <div className="md:col-span-4 lg:col-span-3 lg:col-start-10 flex flex-col justify-end text-sm text-slate-500 font-light space-y-6">
                <FadeIn delay={350}>
                  <p>
                    Powered by precise orbital data, providing a scientifically grounded perspective of our stellar neighborhood.
                  </p>
                  <div className="w-full h-[1px] bg-slate-800" />
                  <p>
                    Recommended: Desktop view for full target acquisition and cinematic panning capabilities.
                  </p>
                </FadeIn>
              </div>
            </div>
          </HeroParallax>
        </div>
      </main>

      {/* Capabilities Section - Asymmetric Layout with Scroll Reveals */}
      <section className="relative z-10 px-6 md:px-12 py-32 bg-slate-950/60 backdrop-blur-sm border-t border-slate-900">
        <div className="max-w-screen-2xl mx-auto">
          <FadeIn>
            <h2 className="text-sm font-semibold tracking-widest uppercase text-slate-500 mb-32">
              Simulation Capabilities
            </h2>
          </FadeIn>
          
          <div className="flex flex-col gap-40">
            
            {/* Capability I - Massive Left Alignment */}
            <FadeIn>
              <div className="max-w-4xl">
                <div className="font-serif italic text-6xl md:text-8xl text-slate-800 mb-8 select-none transition-colors duration-300 hover:text-slate-600">
                  {capabilities[0].id}
                </div>
                <h3 className="font-serif text-4xl md:text-6xl mb-6 text-slate-200">{capabilities[0].title}</h3>
                <p className="text-slate-400 text-xl md:text-2xl font-light leading-relaxed mb-8 max-w-2xl">
                  {capabilities[0].description}
                </p>
                <p className="text-sm text-amber-500/80 tracking-widest uppercase font-semibold">
                  {capabilities[0].details}
                </p>
              </div>
            </FadeIn>

            {/* Capability II - Right Aligned with offset */}
            <FadeIn>
              <div className="max-w-3xl self-end text-right ml-auto">
                <div className="font-serif italic text-6xl md:text-8xl text-slate-800 mb-8 select-none transition-colors duration-300 hover:text-slate-600">
                  {capabilities[1].id}
                </div>
                <h3 className="font-serif text-4xl md:text-5xl mb-6 text-slate-200">{capabilities[1].title}</h3>
                <p className="text-slate-400 text-lg md:text-xl font-light leading-relaxed mb-8 ml-auto max-w-xl">
                  {capabilities[1].description}
                </p>
                <p className="text-sm text-blue-400/80 tracking-widest uppercase font-semibold">
                  {capabilities[1].details}
                </p>
              </div>
            </FadeIn>

            {/* Capability III - Indented / Centered Column */}
            <FadeIn>
              <div className="max-w-2xl mx-auto text-center mt-12">
                <div className="font-serif italic text-5xl md:text-7xl text-slate-800 mb-6 select-none transition-colors duration-300 hover:text-slate-600">
                  {capabilities[2].id}
                </div>
                <h3 className="font-serif text-3xl md:text-4xl mb-6 text-slate-200">{capabilities[2].title}</h3>
                <p className="text-slate-400 text-lg font-light leading-relaxed mb-8">
                  {capabilities[2].description}
                </p>
                <p className="text-sm text-orange-400/80 tracking-widest uppercase font-semibold">
                  {capabilities[2].details}
                </p>
              </div>
            </FadeIn>

            {/* Capability IV - Full Width Bordered Box */}
            <FadeIn>
              <div className="w-full border border-slate-800/60 bg-[#020617]/80 backdrop-blur-md p-12 md:p-24 rounded-3xl mt-12 relative overflow-hidden group hover:border-slate-600 transition-colors duration-300">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-500/30 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
                  <div>
                    <div className="font-serif italic text-4xl text-slate-700 mb-4 select-none">
                      {capabilities[3].id}
                    </div>
                    <h3 className="font-serif text-3xl md:text-5xl mb-4 text-slate-200">{capabilities[3].title}</h3>
                    <p className="text-slate-400 text-lg font-light leading-relaxed max-w-xl">
                      {capabilities[3].description}
                    </p>
                  </div>
                  <div className="shrink-0 text-left md:text-right">
                    <p className="text-3xl font-light text-slate-300 mb-2">Up to 5.0x Speed</p>
                    <p className="text-sm text-slate-500 tracking-widest uppercase font-semibold">Precision Pause Control</p>
                  </div>
                </div>
              </div>
            </FadeIn>

          </div>
        </div>
      </section>

      {/* Giant CTA Section */}
      <section className="relative w-full border-t border-slate-900 bg-[#020617] overflow-hidden">
        {/* Deep, warm celestial glow from the bottom */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-full max-w-4xl h-[500px] bg-orange-600/10 blur-[120px] rounded-full pointer-events-none" />
        
        <FadeIn direction="none" delay={150}>
          <div className="relative z-10 px-6 md:px-12 py-40 md:py-56 text-center flex flex-col items-center">
            <h2 className="font-serif text-5xl md:text-7xl lg:text-8xl mb-12 text-slate-200">
              Begin Observation
            </h2>
            <Link 
              href="/explore" 
              className="group inline-flex items-center gap-4 px-10 py-5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-700 hover:border-slate-500 text-lg font-medium transition-[background-color,border-color,transform] duration-200 ease-out hover:scale-105"
            >
              Launch Interactive Simulation
              <svg className="w-5 h-5 text-slate-400 group-hover:text-slate-100 transition-colors duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </FadeIn>
      </section>
      
      {/* Footer */}
      <footer className="relative z-10 py-8 text-center text-sm text-slate-600 bg-[#020617] border-t border-slate-900">
        <p>© {new Date().getFullYear()} Solar System Observatory.</p>
      </footer>
    </div>
  );
}
