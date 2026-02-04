
import React, { useEffect, useRef } from 'react';
import { X, Play, Pause, Volume2 } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  isOpen: boolean;
  onClose: () => void;
  caller: string;
}

export default function AudioPlayer({ src, isOpen, onClose, caller }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);

  useEffect(() => {
    if (isOpen && audioRef.current) {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else if (!isOpen && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isOpen, src]);

  if (!isOpen) return null;

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 p-4 shadow-xl z-50 transform transition-transform duration-300">
      <div className="max-w-7xl mx-auto flex items-center gap-4">
        <button 
          onClick={togglePlay}
          className="p-3 bg-blue-600 hover:bg-blue-500 rounded-full text-white transition-colors"
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>

        <div className="flex-1">
          <p className="text-sm text-slate-400">Playing Recording</p>
          <p className="font-medium text-white">{caller}</p>
        </div>

        <audio 
          ref={audioRef} 
          src={src} 
          controls 
          className="hidden" // Custom UI or simple native controls? Let's use custom for minimal vibe
          onEnded={() => setIsPlaying(false)}
        />
        
        {/* Fallback to native controls if needed, but let's try just the button + close for now or partial */}
        <div className="w-1/3 mx-4">
             {/* Progress bar could go here, but keep it simple first */}
        </div>

        <button 
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
