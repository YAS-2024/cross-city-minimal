import type { CardData } from '../types';

export const CARD_MASTER_DATA: CardData[] = [
  // ==========================================
  // 拠点
  // ==========================================
  { 
    id: "town_hall", name: "役場", category: "TOWN_HALL", rarity: "COMMON", cost: 0, 
    inDeck: false, image: "town_hall.png",
    stats: { p1: 1, p2: 1, tax: 2 }, 
    arrows: ["UP", "DOWN", "LEFT", "RIGHT"], effects: [] 
  },

  // ==========================================
  // 居住系
  // ==========================================
  { 
    id: "slum", name: "スラム", category: "RESIDENTIAL", rarity: "COMMON", cost: 1, 
    image: "slum.png",
    stats: { p1: 1, p2: 0, tax: 0 }, 
    arrows: ["UP", "DOWN", "LEFT", "RIGHT"], effects: [],
    description: "低コストで配置しやすいが、効果は薄い。"
  },
  { 
    id: "apartment", name: "アパート", category: "RESIDENTIAL", rarity: "COMMON", cost: 3, 
    image: "apartment.png",
    stats: { p1: 3, p2: 0, tax: 1 }, 
    arrows: ["UP"], effects: [],
    description: "標準的な住居。上方向へのみ展開可能。"
  },
  { 
    id: "mansion", name: "マンション", category: "RESIDENTIAL", rarity: "UNCOMMON", cost: 5, 
    image: "mansion.png",
    stats: { p1: 5, p2: 0, tax: 1 }, 
    arrows: ["LEFT", "RIGHT"], effects: [],
    description: "多くの人口を抱える。横展開のみ。"
  },
  { 
    id: "high_class_area", name: "高級住宅地", category: "RESIDENTIAL", rarity: "RARE", cost: 6, 
    image: "high_class_area.png",
    stats: { p1: 4, p2: 0, tax: 3 }, 
    arrows: ["UP"], effects: [],
    description: "人口と高い税収を両立する。"
  },
  { 
    id: "tower_mansion", name: "タワマン", category: "RESIDENTIAL", rarity: "LEGENDARY", cost: 8, 
    image: "tower_mansion.png",
    stats: { p1: 10, p2: -1, tax: 2 }, 
    arrows: ["UP"], effects: [],
    description: "圧倒的な人口を誇るが、インフラを圧迫(-1)する。"
  },

  // ==========================================
  // 非居住系
  // ==========================================
  { 
    id: "road", name: "道路", category: "NON_RESIDENTIAL", rarity: "COMMON", cost: 0, 
    image: "road.png",
    stats: { p1: 0, p2: 0, tax: 0 }, 
    arrows: ["UP", "DOWN", "LEFT", "RIGHT"], effects: [],
    description: "コスト0で展開できる。"
  },
  { 
    id: "convenience_store", name: "コンビニ", category: "NON_RESIDENTIAL", rarity: "COMMON", cost: 1, 
    image: "convenience_store.png",
    stats: { p1: 0, p2: 1, tax: 1 }, 
    arrows: ["UP", "DOWN"], effects: [],
    description: "小銭稼ぎ用。"
  },
  { 
    id: "supermarket", name: "スーパー", category: "NON_RESIDENTIAL", rarity: "UNCOMMON", cost: 2, 
    image: "supermarket.png",
    stats: { p1: 0, p2: 1, tax: 2 }, 
    arrows: ["LEFT", "RIGHT"], effects: [],
    description: "インフラと税収のバランスが良い。"
  },
  { 
    id: "clinic", name: "診療所", category: "NON_RESIDENTIAL", rarity: "UNCOMMON", cost: 2, 
    image: "clinic.png",
    stats: { p1: 0, p2: 2, tax: 0 }, 
    arrows: ["UP", "DOWN", "LEFT", "RIGHT"], 
    effects: [{ trigger: 'PASSIVE', type: 'BUFF_ADJACENT', value: 1, targetCategory: 'RESIDENTIAL', description: "隣接住居の人口+1" }],
    description: "隣接する住居の人口を増やす。"
  },
  { 
    id: "police_station", name: "警察署", category: "NON_RESIDENTIAL", rarity: "UNCOMMON", cost: 3, 
    image: "police_station.png",
    stats: { p1: 0, p2: 2, tax: 0 }, 
    arrows: ["UP", "LEFT", "RIGHT"], 
    effects: [{ trigger: 'PASSIVE', type: 'BUFF_ADJACENT', value: 1, targetCategory: 'RESIDENTIAL', description: "隣接住居の人口+1" }],
    description: "治安を守り、隣接住居の人口を増やす。"
  },
  { 
    id: "park", name: "公園", category: "NON_RESIDENTIAL", rarity: "COMMON", cost: 2, 
    image: "park.png",
    stats: { p1: 0, p2: 1, tax: 0 }, 
    arrows: ["UP", "DOWN", "LEFT", "RIGHT"], 
    effects: [{ trigger: 'PASSIVE', type: 'BUFF_ADJACENT', value: 1, targetCategory: 'RESIDENTIAL', description: "隣接住居の人口+1" }],
    description: "隣接する住居の人口を増やす。"
  },
  { 
    id: "factory", name: "工場", category: "NON_RESIDENTIAL", rarity: "RARE", cost: 3, 
    image: "factory.png",
    stats: { p1: 0, p2: 3, tax: 1 }, 
    arrows: ["DOWN"], effects: [],
    description: "強力なインフラ源だが、配置が難しい。"
  },
  { 
    id: "station", name: "駅", category: "NON_RESIDENTIAL", rarity: "RARE", cost: 4, 
    image: "station.png",
    stats: { p1: 0, p2: 2, tax: 1 }, 
    arrows: ["LEFT", "RIGHT"], 
    effects: [{ trigger: 'ON_PLACE', type: 'DRAW', value: 1, description: "配置時: 1ドロー" }],
    description: "配置時にカードを補充できる。"
  },
  { 
    id: "office", name: "オフィス", category: "NON_RESIDENTIAL", rarity: "RARE", cost: 4, 
    image: "office.png",
    stats: { p1: 0, p2: 2, tax: 1 }, 
    arrows: ["UP", "DOWN"], 
    effects: [{ trigger: 'PASSIVE', type: 'BUFF_GLOBAL', value: 1, targetCategory: 'NON_RESIDENTIAL', description: "自分の[非居住系]全ての人口+1" }],
    description: "ビジネス街を形成し、非居住系の価値を高める（※現在は人口加算仕様）。"
  },
  {
  "id": "power_plant",
  "name": "火力発電所",
  "category": "NON_RESIDENTIAL",
  "rarity": "RARE",
  "cost": 4,
  "image": "power_plant.png",
  "stats": {
    "p1": 0,
    "p2": 8,
    "tax": 1
  },
  "arrows": [
    "LEFT",
    "RIGHT"
  ],
  "effects": [
    {
      "trigger": "PASSIVE",
      "type": "BUFF_ADJACENT",
      "value": -1,
      "targetCategory": "RESIDENTIAL",
      "description": "騒音と排煙。隣接する居住区の人口-1"
    }
  ],
  "description": "都市の活動を支える巨大なエネルギー源。住宅地からは離して建設すべきだ。"
}

];