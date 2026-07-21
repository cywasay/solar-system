import Scene from '@/components/Scene';
import InfoPanel from '@/components/ui/InfoPanel';
import PlanetMenu from '@/components/ui/PlanetMenu';
import TimeControls from '@/components/ui/TimeControls';

export default function Home() {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950">
      {/* 3D Scene Container */}
      <div className="w-full h-full">
        <Scene />
      </div>

      {/* 2D HUD Overlays — menu top-left, info top-right, controls bottom-centre */}
      <PlanetMenu />
      <InfoPanel />
      <TimeControls />
    </main>
  );
}

