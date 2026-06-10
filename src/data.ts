import { EnemyTemplate } from './types';

export const ENEMIES: EnemyTemplate[] = [
  {
    name: 'ネオンフォックス (Neon Fox)',
    hp: 80,
    maxHp: 80,
    baseDmg: 8,
    attackInterval: 4500, // moves slowly
    color: 'from-orange-500 to-amber-400',
    glowColor: 'rgba(249, 115, 22, 0.5)',
    icon: 'Sparkle',
    description: 'サイバー都市のネオンに潜む機敏な狐獣人。動きは読みやすい。',
    trait: '【特使】練習用。攻撃チャージが遅く、タイミングに合わせやすい。',
    defense: 0
  },
  {
    name: 'アイアン・センチネル (Iron Sentinel)',
    hp: 150,
    maxHp: 150,
    baseDmg: 14,
    attackInterval: 5000,
    color: 'from-zinc-600 to-slate-400',
    glowColor: 'rgba(148, 163, 184, 0.5)',
    icon: 'Shield',
    description: '古代の装甲にサイバー技術が埋め込まれた防衛用ドローン歩兵。',
    trait: '【特使：鉄壁】固定防御5。PERFECTを出すことで防御力を無視してダメージを貫通できる。',
    defense: 5
  },
  {
    name: 'サイバー・シノビ (Cyber Shinobi)',
    hp: 140,
    maxHp: 140,
    baseDmg: 12,
    attackInterval: 3200, // fast attacker!
    color: 'from-fuchsia-600 to-indigo-500',
    glowColor: 'rgba(217, 70, 239, 0.5)',
    icon: 'Swords',
    description: '時空の歪みを利用して瞬時に斬撃を仕掛ける超高速サイバー暗殺者。',
    trait: '【特使：神速】攻撃までの速度が極めて速い。パリィゲージの幅が少し狭い。',
    defense: 2
  },
  {
    name: 'プラズマ・ドラゴン (Plasma Dragon)',
    hp: 220,
    maxHp: 220,
    baseDmg: 25,
    attackInterval: 6000, // slow but lethal!
    color: 'from-red-600 to-rose-400',
    glowColor: 'rgba(239, 68, 68, 0.5)',
    icon: 'Flame',
    description: 'プラズマコアを動力源とする巨大戦闘竜。一撃が致命傷。',
    trait: '【特使：重装甲】攻撃を受けるとたまにプラズマシールドを張り、攻撃を阻む。パリィ成功時に盾が割れる。',
    defense: 4
  },
  {
    name: 'マトリクス・アーキテクト (Matrix Architect)',
    hp: 350,
    maxHp: 350,
    baseDmg: 20,
    attackInterval: 4800,
    color: 'from-cyan-500 via-emerald-400 to-teal-500',
    glowColor: 'rgba(6, 182, 212, 0.7)',
    icon: 'Crown',
    description: '時空プログラムそのものを書き換え、支配する電脳神話の主。',
    trait: '【特使：時空改変】一定時間ごとにゲージの移動速度がランダムに入れ替わり、プレイヤーの乱調を誘う。',
    defense: 6
  }
];

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  effectType: 'maxHp' | 'baseDmg' | 'parryWidth' | 'gaugeSpeed' | 'focusGains' | 'unlockSkill' | 'heal';
  effectValue: number;
  skillKey?: 'chronoSlow' | 'doubleSlash' | 'lifesteal';
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'heal-potion',
    name: 'リカバリードーズ',
    description: '心身のデータをリフレッシュし、体力を 50 回復する。',
    cost: 15,
    icon: 'Heart',
    effectType: 'heal',
    effectValue: 50
  },
  {
    id: 'hp-expand',
    name: 'コア増幅ユニット',
    description: 'マスターコアを拡張し、最大体力を 20 上昇させる。',
    cost: 25,
    icon: 'ShieldPlus',
    effectType: 'maxHp',
    effectValue: 20
  },
  {
    id: 'power-overload',
    name: 'サイバーオプティマ',
    description: '武器ドライブの周波数を底上げし、攻撃力を 3 上昇させる。',
    cost: 30,
    icon: 'Zap',
    effectType: 'baseDmg',
    effectValue: 3
  },
  {
    id: 'perfect-tune',
    name: '精密オシレーター',
    description: 'タイミングゲージのPERFECT/GREAT当たり判定エリアを 15% 拡張する。',
    cost: 35,
    icon: 'Target',
    effectType: 'parryWidth',
    effectValue: 0.15
  },
  {
    id: 'gear-slow',
    name: 'タイムスタビライザー',
    description: '感覚クロックを減速し、タイミングゲージの基本移動速度を 8% 抑制して狙いやすくする。',
    cost: 40,
    icon: 'Gauge',
    effectType: 'gaugeSpeed',
    effectValue: 0.92
  },
  {
    id: 'skill-lifesteal',
    name: 'アブソープション',
    description: '生命力抽出回路をアロック。攻撃でPERFECTかGREATを達成した際、与えたダメージの15%体力を復元、回復する。',
    cost: 60,
    icon: 'Atom',
    effectType: 'unlockSkill',
    effectValue: 0,
    skillKey: 'lifesteal'
  },
  {
    id: 'skill-slow',
    name: 'クロノディレイ',
    description: 'バーストスキルを解放。バーストゲージ発動時、1ターンの間ゲージポインター速度を劇的に遅くし、PERFECTを狙いやすくする。',
    cost: 50,
    icon: 'Hourglass',
    effectType: 'unlockSkill',
    effectValue: 0,
    skillKey: 'chronoSlow'
  },
  {
    id: 'skill-double',
    name: 'ダブル・アクセル',
    description: '加速多重構造チップ。バーストスキル発動中、全ての攻撃が自動的に「2連ヒット」する。',
    cost: 75,
    icon: 'Flame',
    effectType: 'unlockSkill',
    effectValue: 0,
    skillKey: 'doubleSlash'
  }
];
export const INITIAL_PLAYER: any = {
  hp: 100,
  maxHp: 100,
  baseDmg: 12,
  focus: 0,
  maxFocus: 100,
  shards: 10,
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
