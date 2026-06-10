import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Swords, Shield, Heart, Zap, Target, Gauge, Hourglass, Atom, 
  Crown, Sparkle, Flame, ShieldPlus, Volume2, VolumeX, AlertCircle, 
  Sword, Info, ZapOff
} from 'lucide-react';
import { PlayerState, EnemyState, FloatingText, LogEntry } from '../types';
import { sounds } from '../sound';

interface BattleZoneProps {
  player: PlayerState;
  enemy: EnemyState;
  onPlayerHitEnemy: (accuracy: 'perfect' | 'great' | 'good' | 'miss', actualDmg: number) => void;
  onEnemyAttackPlayer: (parryAccuracy: 'perfect' | 'great' | 'good' | 'miss') => void;
  onSkillActivation: (skillName: string) => void;
  combatLog: LogEntry[];
  floatingTexts: FloatingText[];
  addFloatingText: (text: string, x: number, y: number, type: FloatingText['type']) => void;
  isVolumeMuted: boolean;
  onToggleMute: () => void;
  layoutMode: '16-9' | 'phone';
}

export default function BattleZone({
  player,
  enemy,
  onPlayerHitEnemy,
  onEnemyAttackPlayer,
  onSkillActivation,
  combatLog,
  floatingTexts,
  addFloatingText,
  isVolumeMuted,
  onToggleMute,
  layoutMode
}: BattleZoneProps) {
  // State for Timing Gauge pointer position (0 - 100)
  const [pointerPos, setPointerPos] = useState<number>(0);
  const pointerDir = useRef<number>(1);
  const [isGaugeRunning, setIsGaugeRunning] = useState<boolean>(true);
  
  // High fidelity trigger state for screenshake
  const [screenShake, setScreenShake] = useState<boolean>(false);
  const [flashRed, setFlashRed] = useState<boolean>(false);
  const [enemyFlashWhite, setEnemyFlashWhite] = useState<boolean>(false);

  // Focus and Active Battle Modes
  const [activeTab, setActiveTab] = useState<'slash' | 'parry' | 'burst'>('slash');
  const [parryTargetCenter, setParryTargetCenter] = useState<number>(50);
  
  // Burst mode state tracking
  const [burstHitsLeft, setBurstHitsLeft] = useState<number>(0);

  // References for requestAnimationFrame
  const requestRef = useRef<number | null>(null);

  // Dynamic parameters calculated from status
  const currentSpeed = (layoutMode === 'phone' ? 2.5 : 3.4) * player.gaugeSpeedMultiplier * (enemy.name === 'マトリクス・アーキテクト (Matrix Architect)' ? (Math.sin(Date.now() / 2000) * 0.4 + 1.1) : 1);

  // Target Zone bounds centered on 50% for standard slashes
  const targetCenter = 50;
  const perfectHalfWidth = 3.5 * player.parryWidthMultiplier;
  const greatHalfWidth = 9.0 * player.parryWidthMultiplier;
  const goodHalfWidth = 18.0 * player.parryWidthMultiplier;

  // Active Parry center and bounds
  const parryPerfectHalf = 4.0 * player.parryWidthMultiplier;
  const parryGreatHalf = 11.0 * player.parryWidthMultiplier;
  const parryGoodHalf = 20.0 * player.parryWidthMultiplier;

  const isPhone = layoutMode === 'phone';

  // Render icons dynamically
  const renderLucideIcon = (name: string, className: string = "") => {
    switch(name) {
      case 'Sparkle': return <Sparkle className={className} />;
      case 'Shield': return <Shield className={className} />;
      case 'Swords': return <Swords className={className} />;
      case 'Flame': return <Flame className={className} />;
      case 'Crown': return <Crown className={className} />;
      default: return <Sword className={className} />;
    }
  };

  // Oscillating Pointer animation loop
  const animatePointer = useCallback((time: number) => {
    setPointerPos((prev) => {
      let next = prev + pointerDir.current * currentSpeed;
      if (next >= 100) {
        next = 100;
        pointerDir.current = -1;
      } else if (next <= 0) {
        next = 0;
        pointerDir.current = 1;
      }
      return next;
    });
    requestRef.current = requestAnimationFrame(animatePointer);
  }, [currentSpeed]);

  useEffect(() => {
    if (isGaugeRunning) {
      requestRef.current = requestAnimationFrame(animatePointer);
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isGaugeRunning, animatePointer]);

  // Handle auto-enemy charging intervals
  useEffect(() => {
    if (enemy.currentHp <= 0 || player.hp <= 0) return;

    let chargingInterval: NodeJS.Timeout;

    if (!enemy.isStunned && activeTab !== 'parry' && activeTab !== 'burst') {
      const stepTimeMs = 100;
      const chargeStep = (stepTimeMs / enemy.attackInterval) * 100;

      chargingInterval = setInterval(() => {
        // Only charge if not stunned
        onEnemyAttackUpdate(chargeStep);
      }, stepTimeMs);
    }

    return () => {
      if (chargingInterval) clearInterval(chargingInterval);
    };
  }, [enemy.currentHp, player.hp, enemy.isStunned, activeTab, enemy.attackInterval]);

  // Internal routine to handle enemy charge update
  const onEnemyAttackUpdate = (chargeStep: number) => {
    if (enemy.chargePercent + chargeStep >= 100) {
      enemy.chargePercent = 100;
      triggerEnemyStrikeWarning();
    } else {
      enemy.chargePercent += chargeStep;
    }
  };

  // Triggered when enemy meter fills: swap to defense/parry mode
  const triggerEnemyStrikeWarning = () => {
    sounds.playBlock(); // warning alert chime
    setActiveTab('parry');
    
    // Set a randomized parry zone center (between 25% and 75%)
    const randCenter = 25 + Math.random() * 50;
    setParryTargetCenter(randCenter);
    
    addFloatingText("🚨 敵攻撃！パリィしろ！", 50, 40, "status");
  };

  // Combat Execution helper
  const handleActionTrigger = () => {
    if (player.hp <= 0 || enemy.currentHp <= 0) return;

    const triggerVisualFeedback = (vibe: 'damage-enemy' | 'perfect' | 'damage-player' | 'good') => {
      if (vibe === 'perfect') {
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), 260);
      } else if (vibe === 'damage-player') {
        setFlashRed(true);
        setTimeout(() => setFlashRed(false), 200);
      } else {
        setEnemyFlashWhite(true);
        setTimeout(() => setEnemyFlashWhite(false), 150);
      }
    };

    if (activeTab === 'slash') {
      const dist = Math.abs(pointerPos - targetCenter);
      let accuracy: 'perfect' | 'great' | 'good' | 'miss' = 'miss';
      let accuracyLabel = "MISS!";
      let sfxToPlay = sounds.playSlash;

      if (dist <= perfectHalfWidth) {
        accuracy = 'perfect';
        accuracyLabel = "CRITICAL PERFECT!!!";
        sfxToPlay = () => sounds.playPerfectHit();
        triggerVisualFeedback('perfect');
      } else if (dist <= greatHalfWidth) {
        accuracy = 'great';
        accuracyLabel = "GREAT!";
        sfxToPlay = () => sounds.playNormalHit();
        triggerVisualFeedback('good');
      } else if (dist <= goodHalfWidth) {
        accuracy = 'good';
        accuracyLabel = "GOOD";
        sfxToPlay = () => sounds.playSlash();
        triggerVisualFeedback('good');
      } else {
        triggerVisualFeedback('damage-player');
      }

      sfxToPlay();
      addFloatingText(accuracyLabel, 50, 38, accuracy === 'perfect' ? 'perfect' : 'status');

      let damageMultiplier = 0;
      if (accuracy === 'perfect') damageMultiplier = 2.5 * player.slashDamageMultiplier;
      else if (accuracy === 'great') damageMultiplier = 1.3 * player.slashDamageMultiplier;
      else if (accuracy === 'good') damageMultiplier = 0.7 * player.slashDamageMultiplier;

      const baseRaw = player.baseDmg * damageMultiplier;
      const finalDmg = accuracy === 'perfect' ? Math.max(1, Math.round(baseRaw)) : Math.max(1, Math.round(baseRaw - enemy.defense));

      onPlayerHitEnemy(accuracy, accuracy === 'miss' ? 0 : finalDmg);

    } else if (activeTab === 'parry') {
      const dist = Math.abs(pointerPos - parryTargetCenter);
      let accuracy: 'perfect' | 'great' | 'good' | 'miss' = 'miss';
      let feedbackMsg = "パリィ失敗！";
      
      if (dist <= parryPerfectHalf) {
        accuracy = 'perfect';
        feedbackMsg = "⚡ 時空パリィ！";
        sounds.playParry();
        triggerVisualFeedback('perfect');
      } else if (dist <= parryGreatHalf) {
        accuracy = 'great';
        feedbackMsg = "🛡️ グレートガード！";
        sounds.playBlock();
        triggerVisualFeedback('good');
      } else if (dist <= parryGoodHalf) {
        accuracy = 'good';
        feedbackMsg = "🛡️ ガード成功！";
        sounds.playBlock();
        triggerVisualFeedback('good');
      } else {
        feedbackMsg = "💥 被弾！";
        sounds.playNormalHit();
        triggerVisualFeedback('damage-player');
      }

      addFloatingText(feedbackMsg, 50, 42, accuracy === 'perfect' ? 'perfect' : 'damage-player');
      onEnemyAttackPlayer(accuracy);
      setActiveTab('slash');

    } else if (activeTab === 'burst') {
      const dist = Math.abs(pointerPos - targetCenter);
      let accuracy: 'perfect' | 'great' | 'good' | 'miss' = 'miss';
      let accuracyLabel = "BURST MISS";
      let multi = 0;

      if (dist <= perfectHalfWidth) {
        accuracy = 'perfect';
        accuracyLabel = "💥 BURST PERFECT!";
        multi = 3.0;
        sounds.playPerfectHit();
        triggerVisualFeedback('perfect');
      } else if (dist <= greatHalfWidth) {
        accuracy = 'great';
        accuracyLabel = "🔥 BURST GREAT!";
        multi = 1.8;
        sounds.playNormalHit();
        triggerVisualFeedback('good');
      } else if (dist <= goodHalfWidth) {
        accuracy = 'good';
        accuracyLabel = "⚡ BURST GOOD!";
        multi = 1.0;
        sounds.playSlash();
        triggerVisualFeedback('good');
      } else {
        sounds.playBlock();
        triggerVisualFeedback('damage-player');
      }

      addFloatingText(accuracyLabel, 50, 35, accuracy === 'perfect' ? 'perfect' : 'status');

      const hitDmg = Math.max(1, Math.round(player.baseDmg * multi * 1.2));
      const finalDmg = accuracy === 'miss' ? 0 : hitDmg;
      const doubleAccMultiplier = player.unlockedSkills.doubleSlash ? 2 : 1;
      const actualDmgApplied = finalDmg * doubleAccMultiplier;

      onPlayerHitEnemy(accuracy, actualDmgApplied);
      
      const remaining = burstHitsLeft - 1;
      setBurstHitsLeft(remaining);

      if (remaining <= 0) {
        setActiveTab('slash');
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleActionTrigger();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [pointerPos, activeTab, player, enemy, burstHitsLeft]);

  const triggerSpecialBurst = () => {
    if (player.focus < player.maxFocus || activeTab !== 'slash') return;
    
    sounds.playSkillCharging();
    setActiveTab('burst');
    setBurstHitsLeft(3);
    onSkillActivation("CHRONO BURST (時空崩壊斬)");

    if (player.unlockedSkills.chronoSlow) {
      addFloatingText("⏳ クロノスロー！", 50, 48, "status");
    }
  };

  return (
    <div className={`w-full h-full flex flex-col justify-between transition-all duration-300 relative ${flashRed ? 'bg-red-950/20' : ''}`}>
      
      {/* 1. HUD Header Area (Strictly super compact) */}
      <div className="w-full flex justify-between items-center py-1 px-2 bg-slate-900/60 border border-slate-800 rounded-lg text-[11px]">
        <div className="flex items-center gap-1.5 font-mono">
          <Crown className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />
          <span className="text-zinc-500">STAGE:</span>
          <span className="text-emerald-400 font-bold">0{player.stage + 1}</span>
        </div>

        {/* Level Modifiers Banner */}
        <div className="flex gap-2.5 font-mono text-[10px]">
          <span className="text-rose-400">ATK: <strong>{player.baseDmg}</strong></span>
          <span className="text-orange-400">SPD: <strong>{Math.round(100 / player.gaugeSpeedMultiplier)}%</strong></span>
        </div>

        <button 
          onClick={onToggleMute}
          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
          id="btn-sound-toggle-battle"
        >
          {isVolumeMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
        </button>
      </div>

      {/* 2. Main Dual Fighting Screen (Flex content fits viewport perfectly without scroll) */}
      <div className={`w-full flex-1 min-h-0 py-2 grid ${isPhone ? 'grid-cols-1 gap-2' : 'grid-cols-2 gap-3'} relative ${screenShake ? 'animate-bounce' : ''}`}>
        
        {/* PLAYER PARTY STATUS */}
        <div className="flex flex-col justify-between p-2.5 border border-slate-800 bg-slate-950/40 rounded-xl relative overflow-hidden h-full">
          <div className="absolute top-0 left-0 w-16 h-16 bg-cyan-500/5 blur-xl rounded-full" />
          
          <div className="relative space-y-2">
            <div className="flex justify-between items-center text-[11px] font-mono">
              <span className="text-cyan-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                PLAYER (時空剣士)
              </span>
              <span className="text-slate-600">RE-19</span>
            </div>

            {/* HP Bar */}
            <div className="space-y-0.5">
              <div className="flex justify-between font-mono text-[10px] text-zinc-400 scale-95 origin-left">
                <span>HP CAPACITY</span>
                <span className="font-bold text-white">{player.hp} / {player.maxHp}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full border border-slate-900 overflow-hidden p-[1px]">
                <motion.div 
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500" 
                  animate={{ width: `${(player.hp / player.maxHp) * 100}%` }}
                  transition={{ duration: 0.15 }}
                />
              </div>
            </div>

            {/* Focus Burst Meter */}
            <div className="space-y-0.5">
              <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono scale-95 origin-left">
                <span className="flex items-center gap-0.5">
                  <Zap className="w-3 h-3 text-amber-400" /> FOCUS POWER
                </span>
                <span className="text-amber-400 font-bold">{player.focus}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-950 rounded-full border border-slate-900 overflow-hidden">
                <div 
                  className="h-full bg-amber-400 transition-all duration-300"
                  style={{ width: `${player.focus}%` }}
                />
              </div>
            </div>
          </div>

          {/* Mini Skill Badges */}
          <div className="mt-1 flex flex-col gap-0.5">
            <span className="text-slate-600 font-mono text-[9px] uppercase scale-95 origin-left">装備中パッシブ</span>
            <div className="flex flex-wrap gap-1">
              {player.unlockedSkills.lifesteal && (
                <span className="px-1.5 py-0.5 bg-emerald-950/70 border border-emerald-800/60 text-emerald-400 text-[9px] rounded font-mono scale-95">吸血</span>
              )}
              {player.unlockedSkills.chronoSlow && (
                <span className="px-1.5 py-0.5 bg-teal-950/70 border border-teal-800/60 text-teal-400 text-[9px] rounded font-mono scale-95">減速</span>
              )}
              {player.unlockedSkills.doubleSlash && (
                <span className="px-1.5 py-0.5 bg-amber-950/70 border border-amber-800/60 text-amber-400 text-[9px] rounded font-mono scale-95">２連</span>
              )}
              {!player.unlockedSkills.lifesteal && !player.unlockedSkills.chronoSlow && !player.unlockedSkills.doubleSlash && (
                <span className="text-slate-600 text-[9px] italic font-mono scale-95">なし</span>
              )}
            </div>
          </div>
        </div>

        {/* ENEMY PARTY STATUS */}
        <div className={`flex flex-col justify-between p-2.5 border border-slate-800 bg-slate-950/40 rounded-xl relative overflow-hidden h-full ${enemyFlashWhite ? 'bg-white/10' : ''}`}>
          <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 blur-xl rounded-full" />

          <div className="space-y-2">
            <div className="flex justify-between items-center text-[11px] font-mono">
              <span className="text-rose-400 font-semibold flex items-center gap-1 truncate max-w-[130px]">
                {renderLucideIcon(enemy.icon, "w-3 h-3 text-rose-500 shrink-0")}
                {enemy.name.split(' (')[0]}
              </span>
              {enemy.isStunned && (
                <span className="px-1 bg-amber-500 text-slate-950 text-[8px] font-bold rounded animate-bounce">
                  STUNGED
                </span>
              )}
            </div>

            {/* Enemy HP Bar */}
            <div className="space-y-0.5">
              <div className="flex justify-between font-mono text-[10px] text-zinc-400 scale-95 origin-left">
                <span>ENEMY HEALTH</span>
                <span className="font-bold text-white">{enemy.currentHp} / {enemy.maxHp}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full border border-slate-900 overflow-hidden p-[1px]">
                <motion.div 
                  className="h-full rounded-full bg-gradient-to-r from-red-500 to-rose-500" 
                  animate={{ width: `${(Math.max(0, enemy.currentHp) / enemy.maxHp) * 100}%` }}
                  transition={{ duration: 0.15 }}
                />
              </div>
            </div>

            {/* Enemy Attack Charge Timer */}
            <div className="space-y-0.5">
              <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono scale-95 origin-left">
                <span className="flex items-center gap-0.5">
                  <Hourglass className="w-3 h-3 text-red-500" /> THREAT CHARGE
                </span>
                <span className={enemy.chargePercent > 80 ? "text-red-500 font-bold" : "text-zinc-500"}>
                  {enemy.chargePercent >= 100 ? "READY" : `${Math.round(enemy.chargePercent)}%`}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-950 rounded-full border border-slate-900 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-100 ${enemy.chargePercent > 80 ? 'bg-gradient-to-r from-orange-400 to-red-500 animate-pulse' : 'bg-rose-500'}`}
                  style={{ width: `${enemy.chargePercent}%` }}
                />
              </div>
            </div>
          </div>

          <p className="mt-1.5 text-zinc-500 font-mono text-[9px] line-clamp-2 h-6 leading-relaxed">
            {enemy.description}
          </p>
        </div>

        {/* Floating Text Damage Popups (Placed centrally inside battlefield container) */}
        <div className="absolute inset-x-0 top-6 pointer-events-none h-24 overflow-hidden flex justify-center items-center">
          <AnimatePresence>
            {floatingTexts.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 1, y: 15, scale: 0.7 }}
                animate={{ opacity: 0, y: -25, scale: 1.1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.85 }}
                className={`absolute font-extrabold text-center text-stroke tracking-tight pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] ${item.fontSize} ${
                  item.type === 'perfect' ? 'text-stroke-cyan text-cyan-300' :
                  item.type === 'damage-player' ? 'text-red-500' :
                  item.type === 'heal' ? 'text-emerald-400' : 'text-yellow-300'
                }`}
                style={{ 
                  left: `${item.x}%`, 
                  top: `${item.y}%`,
                  zIndex: 100
                }}
              >
                {item.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* 3. TIMING GAUGE COMPONENT PANEL */}
      <div className="w-full mt-2 bg-slate-900/40 border border-slate-800/60 p-2.5 rounded-xl flex flex-col items-center gap-2">
        
        {/* Dynamic State Description Banner */}
        <div className="text-[10px] font-mono text-center text-zinc-400 leading-tight">
          {activeTab === 'slash' && (
            <span className="text-cyan-400 font-semibold flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
              アタック：中央の青い目印を狙い撃て！ (SPACE)
            </span>
          )}
          {activeTab === 'parry' && (
            <span className="text-red-400 font-bold flex items-center justify-center gap-1 animate-pulse">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
              強襲：盾印に合わせてミリセカンド防御せよ！
            </span>
          )}
          {activeTab === 'burst' && (
            <span className="text-amber-400 font-bold flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
              時空バースト：あと{burstHitsLeft}発！
            </span>
          )}
        </div>

        {/* The Graphical Visual Gauge Slider */}
        <div className="w-full bg-slate-950 h-5 border border-slate-800 rounded-lg relative overflow-hidden flex items-center shadow-inner">
          {activeTab !== 'parry' ? (
            <>
              {/* GOOD ZONE */}
              <div 
                className="absolute h-full bg-yellow-500/15 border-x border-yellow-500/20"
                style={{ 
                  left: `${targetCenter - goodHalfWidth}%`, 
                  width: `${goodHalfWidth * 2}%` 
                }}
              />
              {/* GREAT ZONE */}
              <div 
                className="absolute h-full bg-amber-500/25 border-x border-amber-500/30"
                style={{ 
                  left: `${targetCenter - greatHalfWidth}%`, 
                  width: `${greatHalfWidth * 2}%` 
                }}
              />
              {/* PERFECT ZONE */}
              <div 
                className="absolute h-full bg-cyan-400/40 shadow-[0_0_10px_rgba(34,211,238,0.5)] border-x border-cyan-400/60"
                style={{ 
                  left: `${targetCenter - perfectHalfWidth}%`, 
                  width: `${perfectHalfWidth * 2}%` 
                }}
              />
              <div className="absolute left-1/2 -translate-x-1/2 h-full w-[1px] bg-cyan-400/80 z-10" />
            </>
          ) : (
            <>
              {/* GOOD GUARD ZONE */}
              <div 
                className="absolute h-full bg-blue-500/10"
                style={{ 
                  left: `${parryTargetCenter - parryGoodHalf}%`, 
                  width: `${parryGoodHalf * 2}%` 
                }}
              />
              {/* GREAT GUARD ZONE */}
              <div 
                className="absolute h-full bg-indigo-500/20"
                style={{ 
                  left: `${parryTargetCenter - parryGreatHalf}%`, 
                  width: `${parryGreatHalf * 2}%` 
                }}
              />
              {/* PERFECT SHIELD ZONE */}
              <div 
                className="absolute h-full bg-emerald-400/40 shadow-[0_0_10px_rgba(52,211,153,0.5)] border-x border-emerald-400/60 flex justify-center items-center"
                style={{ 
                  left: `${parryTargetCenter - parryPerfectHalf}%`, 
                  width: `${parryPerfectHalf * 2}%` 
                }}
              >
                <Shield className="w-3 h-3 text-emerald-200 pointer-events-none" />
              </div>
              <div 
                className="absolute h-full w-[1px] bg-emerald-300 z-10"
                style={{ left: `${parryTargetCenter}%` }}
              />
            </>
          )}

          {/* Oscillating Slider Pointer */}
          <div 
            className="absolute top-0 bottom-0 w-1 h-full z-20 shadow-[0_0_5px_#fff]"
            style={{ 
              left: `${pointerPos}%`, 
              backgroundColor: activeTab === 'parry' ? '#34d399' : '#38bdf8' 
            }}
          />
          {/* Neon Pointer Indicator Dot */}
          <div 
            className="absolute top-0 w-2.5 h-2.5 rounded-full -translate-x-[4px] border border-white z-30"
            style={{ 
              left: `${pointerPos}%`, 
              top: '25%',
              backgroundColor: activeTab === 'parry' ? '#10b981' : '#0ea5e9' 
            }}
          />
        </div>

        {/* Action Buttons Frame */}
        <div className="w-full flex gap-2 justify-center items-center">
          <button
            onClick={handleActionTrigger}
            disabled={player.hp <= 0 || enemy.currentHp <= 0}
            className={`flex-1 py-2 px-4 rounded-lg font-bold text-xs tracking-wider transition-all shadow-md active:scale-95 border cursor-pointer ${
              activeTab === 'parry' 
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 border-emerald-400 text-white shadow-emerald-500/10' 
                : activeTab === 'burst'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 border-amber-400 text-slate-950 animate-pulse'
                : 'bg-gradient-to-r from-cyan-600 to-indigo-600 border-cyan-400 text-white'
            }`}
            id="action-trigger-btn"
          >
            {activeTab === 'parry' ? '🛡️ パリィ！ (SPACE)' : activeTab === 'burst' ? `💥 連撃！ (${burstHitsLeft})` : '⚔️ 斬撃！ (SPACE)'}
          </button>

          <button
            onClick={triggerSpecialBurst}
            disabled={player.focus < player.maxFocus || activeTab !== 'slash' || player.hp <= 0 || enemy.currentHp <= 0}
            className={`py-2 px-3 rounded-lg font-mono text-[10px] border flex items-center justify-center gap-1 transition-all ${
              player.focus >= player.maxFocus && activeTab === 'slash'
                ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 border-pink-400 text-white cursor-pointer hover:brightness-105'
                : 'bg-slate-950 border-slate-900 text-slate-600 cursor-not-allowed'
            }`}
            id="burst-skill-btn"
          >
            <Zap className="w-3 h-3 text-amber-300 animate-bounce" />
            CHRONO BURST!
          </button>
        </div>
      </div>

      {/* 4. COMBAT LOG CONSOLE (Tight space box) */}
      <div className="w-full mt-2 bg-slate-950/80 border border-slate-900/60 rounded-xl p-2 overflow-hidden shadow-inner flex flex-col justify-start">
        <span className="text-zinc-500 font-mono text-[9px] uppercase flex items-center gap-1 mb-1">
          <Info className="w-3 h-3 text-zinc-400" />
          コンバットログ (Battle Log)
        </span>
        <div className="h-14 overflow-y-auto space-y-0.5 pr-1 text-[10px] font-mono scrollbar-thin scrollbar-thumb-slate-800">
          {combatLog.slice(0, 5).map((log) => (
            <div key={log.id} className="py-0.5 border-b border-slate-900/20 flex justify-between gap-2 overflow-hidden truncate">
              <span className={
                log.type === 'player-critical' ? 'text-cyan-400 font-bold' :
                log.type === 'player-hit' ? 'text-zinc-200' :
                log.type === 'enemy-hit' ? 'text-red-400' :
                log.type === 'block' ? 'text-amber-400' :
                log.type === 'heal' ? 'text-emerald-400' : 'text-zinc-500'
              }>
                {log.message}
              </span>
              <span className="text-zinc-600 shrink-0 text-[9px]">{log.timestamp.split(':').slice(1).join(':')}</span>
            </div>
          ))}
          {combatLog.length === 0 && (
            <p className="text-center text-zinc-600 text-[9px] py-2 italic font-sans">交戦を待機しています...</p>
          )}
        </div>
      </div>
    </div>
  );
}
