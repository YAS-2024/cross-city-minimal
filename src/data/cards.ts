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
    id: "student_district", name: "学生街", category: "RESIDENTIAL", rarity: "COMMON", cost: 1, 
    image: "slum.png", // 画像変更推奨
    stats: { p1: 1, p2: 0, tax: 0 }, 
    arrows: ["UP", "DOWN", "LEFT", "RIGHT"], 
    description: "学生が多く住む街。学生は申請により国民年金保険料の支払いを免除できる。"
  },
  { 
    id: "apartment", name: "アパート", category: "RESIDENTIAL", rarity: "COMMON", cost: 2, 
    image: "apartment.png",
    stats: { p1: 3, p2: 0, tax: 1 }, 
    arrows: ["UP"], 
    description: "標準的な住居。"
  },
  { 
    id: "middle_class_area", name: "住宅地", category: "RESIDENTIAL", rarity: "UNCOMMON", cost: 2, 
    image: "slum.png", // 画像変更推奨
    stats: { p1: 1, p2: 0, tax: 1 }, 
    arrows: ["RIGHT"], 
    description: "一軒家が多く並ぶ土地。"
  },
  { 
    id: "mansion", name: "マンション", category: "RESIDENTIAL", rarity: "UNCOMMON", cost: 5, 
    image: "mansion.png",
    stats: { p1: 5, p2: 0, tax: 1 }, 
    arrows: ["LEFT", "RIGHT"], 
    description: "多くの人口を抱える。横展開のみ。"
  },
  { 
    id: "high_class_area", name: "高級住宅地", category: "RESIDENTIAL", rarity: "RARE", cost: 6, 
    image: "high_class_area.png",
    stats: { p1: 4, p2: 0, tax: 3 }, 
    arrows: ["UP"], 
    description: "人口と高い税収を両立する。"
  },
  { 
    id: "tower_mansion", name: "タワマン", category: "RESIDENTIAL", rarity: "LEGENDARY", cost: 8, 
    image: "tower_mansion.png",
    stats: { p1: 10, p2: -1, tax: 2 }, 
    arrows: ["UP"], 
    description: "圧倒的な人口を誇るが、インフラを圧迫(-1)する。"
  },

  // ==========================================
  // インフラ・施設系
  // ==========================================
  { 
    id: "convenience_store", name: "コンビニ", category: "NON_RESIDENTIAL", rarity: "COMMON", cost: 1, 
    image: "convenience_store.png",
    stats: { p1: 0, p2: 1, tax: 1 }, 
    arrows: ["UP", "DOWN"], 
    description: "小銭稼ぎとインフラ確保に。"
  },
  { 
    id: "supermarket", name: "スーパー", category: "NON_RESIDENTIAL", rarity: "UNCOMMON", cost: 2, 
    image: "supermarket.png",
    stats: { p1: 0, p2: 1, tax: 1 }, 
    arrows: ["LEFT"], 
    effects: [{ 
      trigger: 'PASSIVE', type: 'BUFF_ADJACENT', value: 1, targetCategory: 'RESIDENTIAL', targetStat: 'tax',
      description: "隣接住居の税収+1" 
    }],
    description: "周辺地域の経済を活性化する。"
  },
  { 
    id: "clinic", name: "診療所", category: "NON_RESIDENTIAL", rarity: "UNCOMMON", cost: 2, 
    image: "clinic.png",
    stats: { p1: 0, p2: 2, tax: 0 }, 
    arrows: ["UP", "DOWN", "LEFT", "RIGHT"], 
    effects: [{ 
      trigger: 'PASSIVE', type: 'BUFF_ADJACENT', value: 1, targetCategory: 'RESIDENTIAL', targetStat: 'p1',
      description: "隣接住居の人口+1" 
    }],
    description: "医療インフラ。隣接する住居の人口を増やす。"
  },
  { 
    id: "post_office", name: "郵便局", category: "NON_RESIDENTIAL", rarity: "COMMON", cost: 3, 
    image: "post_office.png", 
    stats: { p1: 0, p2: 2, tax: 0 }, 
    arrows: ["UP", "LEFT", "RIGHT"], 
    effects: [{ trigger: 'ON_PLACE', type: 'DRAW', value: 1, description: "配置時: 1ドロー" }],
    description: "通信インフラ。手札を減らさずに配置できる。"
  },
  { 
    id: "police_station", name: "警察署", category: "NON_RESIDENTIAL", rarity: "UNCOMMON", cost: 3, 
    image: "police_station.png",
    stats: { p1: 0, p2: 2, tax: 0 }, 
    arrows: ["UP", "LEFT", "RIGHT"], 
    effects: [{ 
      trigger: 'PASSIVE', type: 'BUFF_ADJACENT', value: 1, targetCategory: 'RESIDENTIAL', targetStat: 'p2',
      description: "隣接住居のインフラ+1" 
    }],
    description: "治安維持。隣接する住居のインフラ価値を高める。"
  },
  { 
    id: "school", name: "学校", category: "NON_RESIDENTIAL", rarity: "RARE", cost: 3, 
    image: "school.png", 
    stats: { p1: 0, p2: 2, tax: 0 }, 
    arrows: ["UP", "DOWN"], 
    effects: [{ 
      trigger: 'PASSIVE', type: 'BUFF_GLOBAL', value: 1, targetCategory: 'RESIDENTIAL', targetStat: 'p1',
      description: "全ての味方住居の人口+1" 
    }],
    description: "教育機関。街全体の住居の価値を高める。"
  },
  { 
    id: "factory", name: "工場", category: "NON_RESIDENTIAL", rarity: "UNCOMMON", cost: 3, 
    image: "factory.png",
    stats: { p1: 0, p2: 3, tax: 1 }, 
    arrows: ["DOWN", "LEFT", "RIGHT"], 
    description: "中盤のインフラの要。配置しやすくなった。"
  },
  { 
    id: "data_center", name: "データセンター", category: "NON_RESIDENTIAL", rarity: "RARE", cost: 4, 
    image: "office.png", 
    stats: { p1: 0, p2: 6, tax: 1 }, // P2を5→6に強化
    arrows: ["UP", "DOWN"], 
    description: "高度な情報処理施設。非常に高いインフラ能力を持つ。"
  },
  // ★複数効果: スタジアム
  { 
    id: "stadium", name: "スタジアム", category: "NON_RESIDENTIAL", rarity: "RARE", cost: 4, 
    image: "park.png", 
    stats: { p1: 0, p2: 2, tax: 1 }, 
    arrows: ["UP", "LEFT", "RIGHT"], 
    effects: [
      { 
        trigger: 'PASSIVE', type: 'BUFF_ADJACENT', value: 2, targetCategory: 'RESIDENTIAL', targetStat: 'p1',
        description: "隣接住居の人口+2" 
      },
      { 
        trigger: 'PASSIVE', type: 'BUFF_ADJACENT', value: -1, targetCategory: 'RESIDENTIAL', targetStat: 'p2',
        description: "混雑。隣接住居のインフラ-1" 
      }
    ],
    description: "熱狂的なイベント施設。人は集まるが周辺は混雑する。"
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
    effects: [{ 
      trigger: 'PASSIVE', type: 'BUFF_GLOBAL', value: 1, targetCategory: 'NON_RESIDENTIAL', targetStat: 'p1', 
      description: "自分の[非居住系]全ての人口+1" 
    }],
    description: "ビジネス街を形成し、非居住系の価値を高める。"
  },
  {
    id: "power_plant", name: "火力発電所", category: "NON_RESIDENTIAL", rarity: "RARE", cost: 4,
    image: "power_plant.png",
    stats: { p1: 0, p2: 8, tax: 1 },
    arrows: ["LEFT", "RIGHT"],
    effects: [{
      trigger: "PASSIVE", type: "BUFF_ADJACENT", value: -1, targetCategory: "RESIDENTIAL", targetStat: 'p1',
      description: "騒音と排煙。隣接する居住区の人口-1"
    }],
    description: "都市の活動を支える巨大なエネルギー源。"
  },
  // ★複数効果: 空港
  { 
    id: "airport", name: "空港", category: "NON_RESIDENTIAL", rarity: "RARE", cost: 5, 
    image: "station.png", 
    stats: { p1: 0, p2: 3, tax: 2 }, 
    arrows: ["UP", "DOWN", "LEFT", "RIGHT"], 
    effects: [
      { trigger: 'ON_PLACE', type: 'DRAW', value: 2, description: "配置時: 2ドロー" },
      { 
        trigger: 'PASSIVE', type: 'BUFF_ADJACENT', value: -2, targetCategory: 'RESIDENTIAL', targetStat: 'p1',
        description: "騒音。隣接住居の人口-2" 
      }
    ],
    description: "強力な物流ハブだが、騒音が激しい。"
  },
  { 
    id: "university", name: "大学", category: "NON_RESIDENTIAL", rarity: "LEGENDARY", cost: 5, 
    image: "office.png", 
    stats: { p1: 0, p2: 5, tax: 0 }, 
    arrows: ["UP", "DOWN", "LEFT", "RIGHT"], 
    effects: [{ 
      trigger: 'PASSIVE', type: 'BUFF_GLOBAL', value: 1, targetCategory: 'RESIDENTIAL', targetStat: 'p1',
      description: "全ての味方住居の人口+1" 
    }],
    description: "街のブランドを高める研究機関。維持費がかかる(税収0)。"
  }
];