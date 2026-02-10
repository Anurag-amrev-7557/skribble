
import { Lobby } from "@/components/Lobby";
import { PenTool, Trophy, MousePointerClick } from "lucide-react";

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

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl z-10 animate-in slide-in-from-bottom-10 fade-in duration-700 delay-200">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl text-center flex flex-col items-center hover:bg-white/15 transition-colors group cursor-default">
          <div className="bg-indigo-500/20 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
            <MousePointerClick className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-black text-white mb-2 tracking-tight">Create & Join</h3>
          <p className="text-indigo-200 text-sm font-medium leading-relaxed">
            Start a private room for friends or jump into a public match instantly. No sign-up required.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl text-center flex flex-col items-center hover:bg-white/15 transition-colors group cursor-default">
          <div className="bg-indigo-500/20 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
            <PenTool className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-black text-white mb-2 tracking-tight">Draw & Guess</h3>
          <p className="text-indigo-200 text-sm font-medium leading-relaxed">
            Take turns drawing the selected word while others guess. Be quick to earn more points!
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl text-center flex flex-col items-center hover:bg-white/15 transition-colors group cursor-default">
          <div className="bg-green-500/20 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-black text-white mb-2 tracking-tight">Score & Win</h3>
          <p className="text-indigo-200 text-sm font-medium leading-relaxed">
            Climb the leaderboard by guessing correctly and drawing clearly. Become the champion!
          </p>
        </div>
      </div>

      <div className="mt-12 text-indigo-300/40 text-[10px] font-bold uppercase tracking-widest z-10 flex gap-4">
        <span>© {new Date().getFullYear()} Skribble.io Clone</span>
        <span>•</span>
        <a href="#" className="hover:text-white transition-colors">Privacy</a>
        <span>•</span>
        <a href="#" className="hover:text-white transition-colors">Terms</a>
      </div>
    </div>
  );
}
