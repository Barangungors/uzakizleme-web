"use client";
import React from 'react';

// 1. Gelecek verilerin kimliğini (tipini) tanımlıyoruz
interface User {
  id: string;
  name: string;
}

interface UserListProps {
  users: User[];
  hostId: string;
  myId: string;
}

const StatusDot = ({ color }: { color: string }) => (
  <div className={`w-3 h-3 rounded-full ${color} flex-shrink-0`} />
);



export default function UserList({ users, hostId, myId }: UserListProps) {
  return (
    <div className="bg-gray-900 rounded-3xl border border-gray-800 p-6 shadow-2xl flex flex-col h-full overflow-hidden">
      
      {/* BAŞLIK VE KİŞİ SAYISI */}
      <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-4">
        <h3 className="text-white text-lg font-extrabold flex items-center gap-3">
          <span className="text-xl">👥</span> Odadakiler
        </h3>
        <span className="text-xs font-bold bg-blue-600/10 text-blue-400 px-3 py-1.5 rounded-full border border-blue-600/30">
          {users?.length || 0} Çevrimiçi
        </span>
      </div>
      
      {/* KULLANICI LİSTESİ */}
      <ul className="space-y-4 overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
        {users?.map((user, index) => {
          const isYou = user.id === myId;
          const isHost = user.id === hostId;
          
          return (
            <li key={index} className="flex justify-between items-center gap-4 py-1">
              <div className="flex items-center gap-3">
                {/* Durum Noktası: Sen=Yeşil, Diğerleri=Gri */}
                <StatusDot color={isYou ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-gray-500'} />
                
                <span className="text-white text-sm font-semibold truncate flex items-center gap-2">
                  {user.name} 
                  {isYou && <span className="text-xs text-gray-600 font-normal">(Sen)</span>}
                </span>
              </div>
              
              {/* 👑 BAŞKAN İÇİN HAVALI TAÇ ETİKETİ */}
              {isHost && (
                <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full border border-amber-500/30 shadow-lg animate-pulse-slow">
                  <span className="text-amber-300 text-xs">👑</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">Kral</span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}