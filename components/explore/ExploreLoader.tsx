interface ExploreLoaderProps {
  exiting?: boolean;
}

/** Shared route and scene loading UI, styled as an orbital calibration instrument. */
export default function ExploreLoader({ exiting = false }: ExploreLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={!exiting}
      className={`explore-loader fixed inset-0 z-[110] overflow-hidden bg-[#020617] text-[#F8FAFC] transition-opacity duration-500 ease-out ${
        exiting ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <div aria-hidden className="absolute inset-0 explore-loader-grid opacity-40" />
      <div aria-hidden className="absolute inset-0 explore-loader-vignette" />

      <div className="absolute left-6 top-6 md:left-12 md:top-10 font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">
        Simulation.01
      </div>
      <div className="absolute right-6 top-6 md:right-12 md:top-10 font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">
        Live observatory
      </div>

      <div className="relative flex min-h-full flex-col items-center justify-center px-6 text-center">
        <div aria-hidden className="relative h-56 w-56 sm:h-64 sm:w-64">
          <span className="explore-loader-orbit absolute inset-0 rounded-full border border-[#1E293B]" />
          <span className="explore-loader-orbit absolute inset-[14%] rounded-full border border-[#1E293B] [animation-delay:-3s]" />
          <span className="explore-loader-orbit absolute inset-[30%] rounded-full border border-[#1E293B] [animation-delay:-6s]" />
          <span className="explore-loader-sun absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#EA580C]" />
          <span className="explore-loader-probe-orbit absolute inset-0">
            <span className="explore-loader-probe absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F8FAFC]" />
          </span>
        </div>

        <p className="mt-12 font-mono text-[10px] uppercase tracking-[0.32em] text-[#EA580C]">
          Calibrating the orbital frame
        </p>
        <h1 className="mt-4 font-serif text-4xl leading-none tracking-tight sm:text-5xl">
          Preparing the observatory.
        </h1>
        <div className="mt-8 w-48 overflow-hidden bg-[#1E293B]">
          <span className="explore-loader-progress block h-px bg-[#EA580C]" />
        </div>
      </div>

      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.22em] text-slate-600 md:bottom-10">
        Warming renderer // staging trajectories
      </p>
    </div>
  );
}
