import React from 'react';
import { motion } from 'motion/react';
import { 
  Heart, Zap, Target, Gauge, Atom, Hourglass, 
  ChevronRight, Sparkle, ShieldPlus, Coins, Flame, Info
} from 'lucide-react';
import { PlayerState } from '../types';
import { SHOP_ITEMS, ShopItem } from '../data';
import { sounds } from '../sound';

interface UpgradeShopProps {
  player: PlayerState;
  onPurchaseItem: (item: ShopItem) => void;
  onNextStage: () => void;
  layoutMode: '16-9' | 'phone';
}

export default function UpgradeShop({
  player,
  onPurchaseItem,
  onNextStage,
  layoutMode
}: UpgradeShopProps) {

  const isPhone = layoutMode === 'phone';

  const renderItemIcon = (iconName: string) => {
    const cls = "w-4 h-4 text-cyan-400";
    switch(iconName) {
      case 'Heart': return <Heart className="w-4 h-4 text-red-400" />;
      case 'ShieldPlus': return <ShieldPlus className="w-4 h-4 text-indigo-400" />;
      case 'Zap': return <Zap className="w-4 h-4 text-amber-400 animate-pulse" />;
      case 'Target': return <Target className={cls} />;
      case 'Gauge': return <Gauge className="w-4 h-4 text-orange-400" />;
      case 'Atom': return <Atom className="w-4 h-4 text-emerald-400" />;
      case 'Hourglass': return <Hourglass className="w-4 h-4 text-teal-400 animate-spin" />;
      case 'Flame': return <Flame className="w-4 h-4 text-rose-500" />;
      default: return <Sparkle className={cls} />;
    }
  };

  const isSkillAlreadyUnlocked = (item: ShopItem): boolean => {
    if (item.effectType !== 'unlockSkill') return false;
    if (item.skillKey === 'lifesteal') return player.unlockedSkills.lifesteal;
    if (item.skillKey === 'chronoSlow') return player.unlockedSkills.chronoSlow;
    if (item.skillKey === 'doubleSlash') return player.unlockedSkills.doubleSlash;
    return false;
  };

  return (
    <div className="w-full h-full flex flex-col justify-between gap-2 text-zinc-200">
      
      {/* 1. Shop Slim Header Block */}
      <div className="w-full flex justify-between items-center bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-lg shrink-0">
        <div className="flex flex-col">
          <h2 className="text-xs md:text-sm font-bold font-sans text-white tracking-wide flex items-center gap-1.5">
            🔩 時空ガレージ (SYSTEM UPGRADE)
          </h2>
          <p className="text-zinc-500 text-[9px] font-mono scale-95 origin-left">
            シャードを用いて剣士のシステムファイルを再構成
          </p>
        </div>

        {/* Currency display */}
        <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-950 border border-slate-900 rounded-lg shadow-inner scale-95">
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[10px] font-mono text-zinc-400">SHARDS:</span>
          <span className="text-xs font-mono font-bold text-amber-300">{player.shards}</span>
        </div>
      </div>

      {/* 2. Grid items (Flex component is internal scroll to avoid stretching screen!) */}
      <div className="flex-1 h-0 overflow-y-auto pr-1">
        <div className={`grid ${isPhone ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'} gap-2 pb-2`}>
          {SHOP_ITEMS.map((item) => {
            const alreadyUnlocked = isSkillAlreadyUnlocked(item);
            const canAfford = player.shards >= item.cost;
            const isHeal = item.effectType === 'heal';
            const isAtMaxHpAndHeal = isHeal && player.hp >= player.maxHp;

            return (
              <div 
                key={item.id} 
                className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all relative overflow-hidden bg-slate-950/40 ${
                  alreadyUnlocked 
                    ? 'border-emerald-800/40 bg-emerald-950/5'
                    : canAfford 
                    ? 'border-slate-800 hover:border-cyan-500/30 bg-slate-900/5' 
                    : 'border-slate-900 opacity-60'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <div className="p-1 bg-slate-900/85 border border-slate-800 rounded">
                      {renderItemIcon(item.icon)}
                    </div>
                    <span className="text-amber-400 font-mono text-[9px] font-bold px-1.5 py-0.5 bg-slate-900/90 rounded border border-slate-800">
                      {item.cost} SH
                    </span>
                  </div>

                  <h3 className="text-[11px] font-bold text-slate-100 flex items-center gap-1">
                    {item.name}
                    {alreadyUnlocked && (
                      <span className="px-1 py-0.25 bg-emerald-500/20 text-emerald-400 text-[8px] font-bold rounded">
                        設定済
                      </span>
                    )}
                  </h3>
                  <p className="text-[9px] text-zinc-500 font-mono line-clamp-2 leading-relaxed mt-0.5">{item.description}</p>
                </div>

                {/* Buy Trigger */}
                <button
                  onClick={() => {
                    if (canAfford && !alreadyUnlocked && !isAtMaxHpAndHeal) {
                      onPurchaseItem(item);
                    }
                  }}
                  disabled={!canAfford || alreadyUnlocked || isAtMaxHpAndHeal}
                  className={`w-full mt-2 py-1 px-2 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    alreadyUnlocked
                      ? 'bg-emerald-950/50 border border-emerald-900/50 text-emerald-500 cursor-not-allowed'
                      : isAtMaxHpAndHeal
                      ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                      : canAfford
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 active:scale-95'
                      : 'bg-slate-900 text-slate-600 border border-slate-900 cursor-not-allowed'
                  }`}
                  id={`btn-buy-${item.id}`}
                >
                  {alreadyUnlocked 
                    ? 'インストール完了' 
                    : isAtMaxHpAndHeal 
                    ? 'HP最高値' 
                    : canAfford 
                    ? 'アップグレード適用' 
                    : 'シャード不足'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Action Footer Navigation Block (Stay compact at the bottom) */}
      <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-2 border-t border-slate-900 pt-2 shrink-0">
        
        {/* Short advice text */}
        <div className="hidden sm:flex gap-1.5 items-start font-mono text-[9px] text-zinc-500 max-w-[50%]">
          <Info className="w-3.5 h-3.5 text-cyan-500 shrink-0 mt-0.5" />
          <p>次を狙いやすくするために、[精密オシレーター] や [タイムスタビライザー] の導入が推奨されます。</p>
        </div>

        <button
          onClick={onNextStage}
          className="w-full sm:w-auto py-2.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 border border-emerald-300 text-slate-950 hover:brightness-105 active:scale-95 font-extrabold text-xs tracking-wider rounded-lg shadow-sm flex items-center justify-center gap-1 hover:cursor-pointer font-mono"
          id="btn-confirm-next-battle"
        >
          次のセキュリティゲートへ進む
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
