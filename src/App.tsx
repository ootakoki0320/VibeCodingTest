import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Swords, Shield, Heart, Zap, Target, Gauge, Hourglass, 
  Crown, Sparkle, Flame, Coins, RotateCcw, Volume2, VolumeX,
  Play, Gamepad2, AlertTriangle, ShieldAlert, Award, AlertCircle,
  Monitor, Smartphone
} from 'lucide-react';
import { PlayerState, EnemyState, FloatingText, LogEntry } from './types';
import { ENEMIES, SHOP_ITEMS, INITIAL_PLAYER, ShopItem } from './data';
import BattleZone from './components/BattleZone';
import UpgradeShop from './components/UpgradeShop';
import { sounds } from './sound';

export default function App() {
  // Screen orchestration states
  const [gameState, setGameState] = useState<'title' | 'battle' | 'shop' | 'gameover' | 'victory'>('title');
  
  // Game ratio layout settings (16:9 widescreen OR mobile phone vertical ratio)
  const [layoutMode, setLayoutMode] = useState<'16-9' | 'phone'>('16-9');

  // Game Entities state
  const [player, setPlayer] = useState<PlayerState>({ ...INITIAL_PLAYER });
  const [enemy, setEnemy] = useState<EnemyState | null>(null);
  
  // High fidelity Logs and Popups
  const [combatLog, setCombatLog] = useState<LogEntry[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  
  // Sound control state
  const [isVolumeMuted, setIsVolumeMuted] = useState<boolean>(false);

  // sound toggle action
  const handleToggleMute = () => {
    const isMuted = sounds.toggleMute();
    setIsVolumeMuted(isMuted);
  };

  // Add Log Entry (capped helper)
  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      message,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    setCombatLog((prev) => [newLog, ...prev.slice(0, 15)]); // Slim down stored records to avoid memory bloat
  }, []);

  // Spawn visual floating text
  const addFloatingText = useCallback((text: string, x: number, y: number, type: FloatingText['type']) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    let fontSize = "text-[12px]";
    if (type === 'perfect') {
      fontSize = "text-[18px] md:text-[22px] font-extrabold";
    } else if (type === 'damage-player') {
      fontSize = "text-[15px] font-bold";
    } else if (type === 'heal') {
      fontSize = "text-[14px] font-bold";
    }

    const newText: FloatingText = { id, text, x, y, color: '', fontSize, type };
    setFloatingTexts((prev) => [...prev, newText]);

    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
    }, 1200);
  }, []);

  // START A NEW GAME FRESH
  const startNewGame = () => {
    const initialPlayerState: PlayerState = {
      hp: 100,
      maxHp: 100,
      baseDmg: 12,
      focus: 0,
      maxFocus: 100,
      shards: 15,
      stage: 0,
      parryWidthMultiplier: 1.0,
      gaugeSpeedMultiplier: 1.0,
      slashDamageMultiplier: 1.0,
      unlockedSkills: {
        chronoSlow: false,
        doubleSlash: false,
        lifesteal: false
      }
    };

    setPlayer(initialPlayerState);
    setCombatLog([]);
    setFloatingTexts([]);

    const template = ENEMIES[0];
    const initialEnemyState: EnemyState = {
      ...template,
      currentHp: template.hp,
      chargePercent: 0,
      isStunned: false,
      stunDuration: 0
    };
    setEnemy(initialEnemyState);
    setGameState('battle');

    sounds.playSlash();
    sounds.playBGM();
    addLog(`⚔️ クロノ・ゲートウェイ開設。ステージ1: [${template.name}] 現る！`, 'system');
  };

  // ADVANCE TO NEXT BATTLE STAGE
  const startNextStage = () => {
    const nextStageIndex = player.stage + 1;
    if (nextStageIndex >= ENEMIES.length) {
      setGameState('victory');
      sounds.playPerfectHit();
      return;
    }

    const updatedPlayer = {
      ...player,
      stage: nextStageIndex,
      focus: 0
    };
    setPlayer(updatedPlayer);

    const template = ENEMIES[nextStageIndex];
    const initialEnemyState: EnemyState = {
      ...template,
      currentHp: template.hp,
      chargePercent: 0,
      isStunned: false,
      stunDuration: 0
    };
    setEnemy(initialEnemyState);
    setGameState('battle');

    sounds.playExplosion();
    addLog(`🔮 ステージ${nextStageIndex + 1}突入。エネミー：${template.name}`, 'system');
  };

  // ENEMY ATTACKS
  const handleEnemyAttackPlayer = (parryAccuracy: 'perfect' | 'great' | 'good' | 'miss') => {
    if (!enemy || player.hp <= 0) return;

    let dmgMitigationPercent = 0.0;
    let parryLogMessage = "";
    let reflectsLeft = false;

    if (parryAccuracy === 'perfect') {
      dmgMitigationPercent = 1.0;
      parryLogMessage = `🛡️ 時空パリィ成功！ 2ターンのスタン付与！`;
      reflectsLeft = true;
    } else if (parryAccuracy === 'great') {
      dmgMitigationPercent = 0.9;
      parryLogMessage = `🛡️ グレートシールド！ 被ダメージを大幅に減衰。`;
    } else if (parryAccuracy === 'good') {
      dmgMitigationPercent = 0.6;
      parryLogMessage = `🛡️ ガード防御成功。`;
    } else {
      dmgMitigationPercent = 0.0;
      parryLogMessage = `💥 パリィミス！強烈なカウンター攻撃！`;
    }

    const calculatedEnemyDmg = Math.round(enemy.baseDmg * (1 - dmgMitigationPercent));
    const nextPlayerHp = Math.max(0, player.hp - calculatedEnemyDmg);

    setPlayer((prev) => ({ ...prev, hp: nextPlayerHp }));
    addLog(parryLogMessage, parryAccuracy === 'perfect' ? 'block' : 'enemy-hit');

    if (calculatedEnemyDmg > 0) {
      addLog(`💥 プレイヤーは ${calculatedEnemyDmg}ダメージを受けた。`, 'enemy-hit');
      addFloatingText(`-${calculatedEnemyDmg} HP`, 30, 42, 'damage-player');
    } else {
      addFloatingText("PARRY!", 30, 42, 'perfect');
    }

    setEnemy((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        chargePercent: 0,
        isStunned: reflectsLeft ? true : prev.isStunned,
        stunDuration: reflectsLeft ? 2 : prev.stunDuration
      };
    });

    if (nextPlayerHp <= 0) {
      setGameState('gameover');
      sounds.playGameOver();
      addLog("❌ 戦闘不能... システム再構築を要します。", "system");
    }
  };

  // ATTACK APPLIED
  const handlePlayerHitEnemy = (accuracy: 'perfect' | 'great' | 'good' | 'miss', actualDmg: number) => {
    if (!enemy || enemy.currentHp <= 0) return;

    if (accuracy === 'miss') {
      const counterDmg = Math.round(enemy.baseDmg * 0.4);
      const nextHp = Math.max(0, player.hp - counterDmg);
      setPlayer((prev) => ({ ...prev, hp: nextHp }));
      
      addFloatingText(`-${counterDmg} HP`, 30, 42, 'damage-player');
      addLog(`❌ ミス！隙を衝かれ即時反撃を被弾。`, 'enemy-hit');

      if (nextHp <= 0) {
        setGameState('gameover');
        sounds.playGameOver();
      }
      return;
    }

    const nextEnemyHp = Math.max(0, enemy.currentHp - actualDmg);
    
    let focusGain = 0;
    if (accuracy === 'perfect') focusGain = 18;
    else if (accuracy === 'great') focusGain = 12;
    else if (accuracy === 'good') focusGain = 6;

    const nextFocus = Math.min(player.maxFocus, player.focus + focusGain);
    let leechHealth = player.unlockedSkills.lifesteal ? Math.round(actualDmg * 0.15) : 0;

    setPlayer((prev) => ({
      ...prev,
      focus: nextFocus,
      hp: Math.min(prev.maxHp, prev.hp + leechHealth)
    }));

    setEnemy((prev) => {
      if (!prev) return null;
      let nextStunned = prev.isStunned;
      let nextStunDuration = prev.stunDuration;

      if (prev.isStunned) {
        nextStunDuration -= 1;
        if (nextStunDuration <= 0) {
          nextStunned = false;
          nextStunDuration = 0;
        }
      }

      return {
        ...prev,
        currentHp: nextEnemyHp,
        isStunned: nextStunned,
        hoverTrigger: false,
        stunDuration: nextStunDuration
      };
    });

    addFloatingText(`-${actualDmg} DMG`, 70, 45, 'damage-enemy');
    if (leechHealth > 0) {
      addFloatingText(`+${leechHealth} HP`, 30, 38, 'heal');
      addLog(`💚 吸血回路: ダメージの15% (${leechHealth} HP) を回収！`, 'heal');
    }

    const comboPrefix = accuracy === 'perfect' ? '⭐ PERFECT' : accuracy === 'great' ? '🔥 GREAT' : '⚔️ SLICE';
    addLog(`${comboPrefix}! [${enemy.name.split(' (')[0]}] に ${actualDmg} ダメージを与えた。`, accuracy === 'perfect' ? 'player-critical' : 'player-hit');

    if (nextEnemyHp <= 0) {
      const shardReward = 20 + player.stage * 10;
      setPlayer((prev) => ({ ...prev, shards: prev.shards + shardReward }));
      
      sounds.playExplosion();
      addLog(`🏆 ゲートボス [${enemy.name.split(' (')[0]}] を駆逐！報酬+ ${shardReward} SHARDS`, 'system');
      
      if (player.stage === ENEMIES.length - 1) {
        setGameState('victory');
        sounds.playPerfectHit();
      } else {
        setGameState('shop');
        sounds.playHeal();
      }
    }
  };

  // PURCHASE ACTION
  const handlePurchaseItem = (item: ShopItem) => {
    if (player.shards < item.cost) return;
    sounds.playHeal();
    
    setPlayer((prev) => {
      const nextShards = prev.shards - item.cost;
      
      switch(item.effectType) {
        case 'heal':
          return { ...prev, hp: Math.min(prev.maxHp, prev.hp + item.effectValue), shards: nextShards };
        case 'maxHp':
          return { ...prev, maxHp: prev.maxHp + item.effectValue, hp: prev.hp + item.effectValue, shards: nextShards };
        case 'baseDmg':
          return { ...prev, baseDmg: prev.baseDmg + item.effectValue, shards: nextShards };
        case 'parryWidth':
          return { ...prev, parryWidthMultiplier: prev.parryWidthMultiplier + item.effectValue, shards: nextShards };
        case 'gaugeSpeed':
          return { ...prev, gaugeSpeedMultiplier: prev.gaugeSpeedMultiplier * item.effectValue, shards: nextShards };
        case 'unlockSkill':
          if (item.skillKey) {
            return {
              ...prev,
              unlockedSkills: { ...prev.unlockedSkills, [item.skillKey]: true },
              gaugeSpeedMultiplier: item.skillKey === 'chronoSlow' ? prev.gaugeSpeedMultiplier * 0.9 : prev.gaugeSpeedMultiplier,
              shards: nextShards
            };
          }
          return { ...prev, shards: nextShards };
        default:
          return prev;
      }
    });

    addLog(`🔩 システムアップグレード [${item.name}] を有効化！`, 'heal');
  };

  const handleSkillActivation = (skillName: string) => {
    addLog(`✨ バースト：[${skillName}] 発動！３連続高速チャンス！`, 'player-critical');
    setPlayer((prev) => ({ ...prev, focus: 0 }));
  };

  const isAspectWidescreen = layoutMode === '16-9';

  return (
    <div className="absolute inset-0 bg-[#06080e] text-zinc-100 flex flex-col items-center justify-between overflow-hidden p-1 sm:p-2 select-none font-sans">
      
      {/* Dynamic Background Matrix Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.05),transparent)] pointer-events-none" />
      <div className="absolute top-10 left-10 w-60 h-60 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* 1. TOP DUAL SWITCH CONTROLE PANELS (Always Slim, persistent & fixed height) */}
      <header className="w-full max-w-5xl flex justify-between items-center px-4 py-1.5 shrink-0 bg-slate-950/80 border border-slate-900 rounded-xl shadow-2xl relative z-20 gap-2 mb-1">
        <div className="flex items-center gap-1.5">
          <Gamepad2 className="w-4 h-4 text-cyan-400 animate-pulse" />
          <h1 className="text-[12px] font-black tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-emerald-400 to-indigo-400">
            CHRONO SLASHER
          </h1>
        </div>

        {/* Real-time 16:9 / Phone Toggle Selector */}
        <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 shadow-inner">
          <button
            onClick={() => setLayoutMode('16-9')}
            className={`px-2.5 py-1 text-[10px] font-mono leading-none rounded-md transition-all flex items-center gap-1 ${
              isAspectWidescreen 
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 shadow' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
            id="layout-toggle-pc"
          >
            <Monitor className="w-3 h-3" />
            <span>🖥️ WIDE 16:9</span>
          </button>
          
          <button
            onClick={() => setLayoutMode('phone')}
            className={`px-2.5 py-1 text-[10px] font-mono leading-none rounded-md transition-all flex items-center gap-1 ${
              !isAspectWidescreen 
                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 shadow' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
            id="layout-toggle-mobile"
          >
            <Smartphone className="w-3 h-3" />
            <span>📱 PHONE MB</span>
          </button>
        </div>

        {/* Global info tag */}
        <span className="hidden md:inline font-mono text-[9px] text-zinc-500 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-900">
          PROTOTYPE RE-V4
        </span>
      </header>

      {/* 2. PERSISTENT CORE FRAME CONTAINER (Occupies exactly the remaining viewport, never overflows!) */}
      <div className="flex-1 h-0 w-full flex items-center justify-center overflow-hidden p-1 relative z-10">
        
        {/* Dynamic Aspect Ratio Wrapper Mimicking Real Device Terminals */}
        <div 
          className={`h-full transition-all duration-300 border border-slate-800 bg-[#070b12] rounded-2xl md:rounded-3xl p-3 md:p-4.5 flex flex-col justify-between overflow-hidden shadow-[0_0_35px_rgba(34,211,238,0.06)] relative ${
            isAspectWidescreen 
              ? 'aspect-[16/9] w-full max-w-4xl max-h-none' 
              : 'aspect-[9/16] w-full max-w-[370px]'
          }`}
          style={{ maxHeight: '100%' }}
        >
          {/* Subtle tactile hardware details */}
          <div className="absolute top-1 left-1.5 w-1.5 h-1.5 bg-slate-800 rounded-full" />
          <div className="absolute top-1 right-1.5 w-1.5 h-1.5 bg-slate-800 rounded-full" />
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-slate-900 rounded-full opacity-40" />

          <AnimatePresence mode="wait">
            
            {/* TITLE APP VIEW */}
            {gameState === 'title' && (
              <motion.div 
                key="title-screen"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full flex flex-col justify-between items-center text-center p-2.5"
              >
                {/* Visual Lotus Graphic */}
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="p-3 bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 border border-cyan-500/30 rounded-full mb-3 shadow-lg animate-pulse">
                    <Swords className="w-10 h-10 text-cyan-400" />
                  </div>

                  <h1 className="text-xl md:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-emerald-400 to-indigo-500 uppercase">
                    クロノ・スラッシュ
                  </h1>
                  <span className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase block mb-3">
                    - GAUGE TIMING RETRO ARCATOR -
                  </span>

                  <p className="text-zinc-400 text-[11px] leading-relaxed max-w-sm font-mono px-3">
                    【ミリ秒単位の極限同期戦闘】<br/>
                    動くスライダを目標エリアに合わせて停止させよ！
                    敵攻撃ゲージがフルの時は「盾」に合わせて完璧に弾く（パリィ）ことで攻撃を封殺し、怒涛の連続技を叩き込める。
                  </p>
                </div>

                {/* Quick tutorial cheatsheet (Very compact!) */}
                <div className="w-full bg-slate-950/80 p-2.5 rounded-lg border border-slate-900 text-left font-mono text-[9px] space-y-1 my-3 max-w-md shrink-0">
                  <div className="flex gap-2 text-cyan-400 font-bold uppercase tracking-wider">
                    <span>⚡ バトル仕様：</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                    <div>🎯 <span className="text-cyan-300">PERFECT:</span> 2.5倍威力 & 防護貫通</div>
                    <div>⚡ <span className="text-yellow-400">GREAT:</span> 1.3倍威力</div>
                    <div>🛡️ <span className="text-emerald-400">PARRY:</span> 完全無効 ＆ カウンタースタン</div>
                    <div>💀 <span className="text-red-400">MISS:</span> 攻撃不発 ＆ 強制反撃被弾</div>
                  </div>
                </div>

                <div className="w-full max-w-sm flex flex-col gap-2 shrink-0">
                  <button
                    onClick={startNewGame}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 border border-emerald-300 text-slate-950 font-extrabold text-xs tracking-widest rounded-lg hover:brightness-105 active:scale-95 transition-all shadow-lg hover:cursor-pointer uppercase"
                    id="btn-play-start"
                  >
                    システム接続：戦闘開始 (START)
                  </button>

                  <button
                    onClick={handleToggleMute}
                    className="w-full py-1.5 border border-slate-800 bg-slate-900/50 hover:bg-slate-800 rounded-lg font-mono text-[10px] text-zinc-300 flex items-center justify-center gap-1 hover:cursor-pointer"
                    id="btn-sound-toggle-title"
                  >
                    {isVolumeMuted ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-red-400" />
                        <span>効果音：ミュート中 (タップで有効)</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                        <span>効果音 ＆ 音楽 稼働中 (TAP TO MUTE)</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* BATTLE APP VIEW */}
            {gameState === 'battle' && enemy && (
              <motion.div 
                key="battle-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full"
              >
                <BattleZone
                  player={player}
                  enemy={enemy}
                  onPlayerHitEnemy={handlePlayerHitEnemy}
                  onEnemyAttackPlayer={handleEnemyAttackPlayer}
                  onSkillActivation={handleSkillActivation}
                  combatLog={combatLog}
                  floatingTexts={floatingTexts}
                  addFloatingText={addFloatingText}
                  isVolumeMuted={isVolumeMuted}
                  onToggleMute={handleToggleMute}
                  layoutMode={layoutMode}
                />
              </motion.div>
            )}

            {/* SHOP APP VIEW */}
            {gameState === 'shop' && (
              <motion.div 
                key="shop-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full"
              >
                <UpgradeShop
                  player={player}
                  onPurchaseItem={handlePurchaseItem}
                  onNextStage={startNextStage}
                  layoutMode={layoutMode}
                />
              </motion.div>
            )}

            {/* GAME OVER APP VIEW */}
            {gameState === 'gameover' && (
              <motion.div 
                key="gameover-screen"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full flex flex-col justify-center items-center text-center p-4"
              >
                <div className="p-2 bg-red-950/80 border border-red-500 rounded-full mb-3 animate-ping">
                  <ShieldAlert className="w-8 h-8 text-red-500" />
                </div>

                <h2 className="text-md md:text-lg font-black text-red-500 font-sans tracking-wider uppercase mb-1">
                  同期接続ロスト
                </h2>
                <span className="text-[8px] font-mono tracking-widest text-zinc-500 uppercase block mb-4">
                  - CHRONO PORTAL DISCONNECTED -
                </span>

                <div className="w-full max-w-sm bg-slate-950/80 border border-slate-900/60 p-3 rounded-lg text-left font-mono text-[10px] space-y-1 mb-6">
                  <div className="flex justify-between border-b border-slate-900 pb-0.5">
                    <span className="text-zinc-500">到達セキュリティレベル:</span>
                    <span className="text-white font-bold">STAGE 0{player.stage + 1}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-0.5">
                    <span className="text-zinc-500">最終処理攻擊力 (ATK):</span>
                    <span className="text-rose-400 font-bold">{player.baseDmg} AP</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-0.5">
                    <span className="text-zinc-500">回収クロノシャード:</span>
                    <span className="text-amber-400 font-bold">{player.shards}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">判定軸補正レベル:</span>
                    <span className="text-cyan-400 font-bold">S-Rank (x{player.parryWidthMultiplier.toFixed(1)})</span>
                  </div>
                </div>

                <button
                  onClick={startNewGame}
                  className="w-full max-w-sm py-2 px-4 bg-gradient-to-r from-red-600 to-orange-500 border border-red-400 text-white font-extrabold text-[12px] tracking-wider rounded-lg active:scale-95 transition-all flex items-center justify-center gap-1 shadow-lg hover:cursor-pointer uppercase"
                  id="btn-retry"
                >
                  <RotateCcw className="w-3.5 h-3.5 animate-spin-slow" />
                  時空再接続 (REINITIALIZE SYSTEM)
                </button>
              </motion.div>
            )}

            {/* GAME VICTORY APP VIEW */}
            {gameState === 'victory' && (
              <motion.div 
                key="victory-screen"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full flex flex-col justify-center items-center text-center p-4 relative"
              >
                <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 rounded-full mb-3 animate-bounce">
                  <Award className="w-8 h-8 text-emerald-400" />
                </div>

                <h2 className="text-lg md:text-xl font-black text-emerald-400 font-sans tracking-wider uppercase mb-1">
                  接続完了 / ミッション成功
                </h2>
                <span className="text-[8px] font-mono tracking-widest text-zinc-500 uppercase block mb-4">
                  - CHRONO PORTAL RESTORED -
                </span>

                <p className="text-zinc-400 text-[10px] leading-relaxed max-w-xs font-mono mb-5">
                  マトリクス・アーキテクト（電脳覇者）の破壊を確認。
                  時空の乱れは終息し、完全なる調律を取り戻しました。
                </p>

                <div className="w-full max-w-sm bg-slate-950/80 border border-slate-900/60 p-3 rounded-lg text-left font-mono text-[10px] space-y-1 mb-6">
                  <span className="text-emerald-400 font-bold block border-b border-slate-900 pb-1">🔧 システムログ一覧：</span>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">接続検証ステータス：</span>
                    <span className="text-emerald-400 font-bold">ALL CLEAR</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">最大出力パワー：</span>
                    <span className="text-rose-400 font-bold">{player.baseDmg} AP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">シャード保有率：</span>
                    <span className="text-amber-400 font-bold">{player.shards}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 w-full max-w-sm shrink-0">
                  <button
                    onClick={startNewGame}
                    className="w-full py-2 bg-gradient-to-r from-emerald-505 to-teal-500 border border-emerald-300 text-slate-950 font-extrabold text-[11px] tracking-wider rounded-lg active:scale-95 transition-all hover:cursor-pointer"
                    id="btn-play-again"
                  >
                    再同期起動 (PLAY AGAIN)
                  </button>
                  <button
                    onClick={() => setGameState('title')}
                    className="w-full py-1 border border-slate-900 text-zinc-500 text-[9px] font-mono rounded-lg hover:text-white"
                  >
                    電脳司令センターへ（タイトル画面）
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>

      {/* 3. TIGHT PERSISTENT FOOTER */}
      <footer className="w-full text-center py-1 bg-slate-950/20 border-t border-slate-950 shrink-0 relative z-20">
        <p className="text-[8px] sm:text-[9px] text-zinc-600 font-mono scale-95 uppercase">
          © 2026 CHRONO SLASHER INC. GAUGE RECONSTRUCTED V4. NO OVERFLOW.
        </p>
      </footer>
    </div>
  );
}
