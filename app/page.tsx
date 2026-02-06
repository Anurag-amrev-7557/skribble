
import { Lobby } from "@/components/Lobby";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#4B4ACF] p-4 relative overflow-hidden">
      {/* Background Pattern (Simple CSS geometric pattern mimicking Skribbl) */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '120px 120px'
        }}
      />

      {/* Modern Header */}
      <div className="mb-8 z-10 text-center animate-in slide-in-from-top-10 fade-in duration-500">
        <h1 className="text-7xl font-black text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.2)] tracking-tighter">
          Skribble<span className="text-white opacity-80">.io</span>
        </h1>
        <p className="text-indigo-200 mt-2 font-bold tracking-wide">DRAW • GUESS • WIN</p>
      </div>

      <Lobby />

      <div className="mt-8 text-indigo-300/60 text-xs font-bold uppercase tracking-widest z-10">
        Made for fun
      </div>
    </div>
  );
}
