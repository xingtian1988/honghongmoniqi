// 预设场景数据

export interface Scenario {
  id: string;
  title: string;
  description: string;
  initialAnger: number;
}

export interface DifficultyConfig {
  name: string;
  description: string;
  maxRounds: number;
  scenarios: Scenario[];
}

export const DIFFICULTIES: Record<string, DifficultyConfig> = {
  easy: {
    name: "初级难度",
    description: "小打小闹，适合入门",
    maxRounds: 8,
    scenarios: [
      {
        id: "forgot-date",
        title: "忘记约会日期",
        description: "今天是一个特别的日子，但你完全忘了",
        initialAnger: 40,
      },
      {
        id: "late-reply",
        title: "回复消息太慢",
        description: "你忙了一整天，期间她发了好几条消息",
        initialAnger: 30,
      },
      {
        id: "work-busy",
        title: "加班忽略了她",
        description: "连续加班一周，周末也没能陪她",
        initialAnger: 35,
      },
      {
        id: "forgot-buy",
        title: "忘记买答应的东西",
        description: "答应下班给她带奶茶，结果忙忘了",
        initialAnger: 25,
      },
      {
        id: "game-too-late",
        title: "打游戏太晚",
        description: "昨晚和朋友开黑到凌晨2点",
        initialAnger: 35,
      },
      {
        id: "wrong-size",
        title: "买错尺码",
        description: "她让你帮忙买衣服，你买错了",
        initialAnger: 20,
      },
      {
        id: "wrong-food",
        title: "买错食物",
        description: "她说了不要香菜，你买的小吃里有香菜",
        initialAnger: 20,
      },
      {
        id: "forgot-call",
        title: "忘记打电话",
        description: "她说早点打电话，但你忙忘了",
        initialAnger: 30,
      },
      {
        id: "movie-forgot",
        title: "忘记一起看电影",
        description: "约好晚上一起看剧，你看到一半睡着了",
        initialAnger: 40,
      },
      {
        id: "wrong-name",
        title: "叫错名字",
        description: "一不小心叫成了前任的名字",
        initialAnger: 50,
      },
    ],
  },
  medium: {
    name: "中级难度",
    description: "需要一些技巧才能哄好",
    maxRounds: 10,
    scenarios: [
      {
        id: "forgot-birthday",
        title: "忘记生日",
        description: "她生日当天你完全忘了，连祝福都是第二天才想起",
        initialAnger: 60,
      },
      {
        id: "late-pickup",
        title: "约会迟到",
        description: "让她在餐厅等了一个小时",
        initialAnger: 55,
      },
      {
        id: "bad-joke",
        title: "说错话惹她生气",
        description: "你说了一句她很在意的话，她生气了",
        initialAnger: 50,
      },
      {
        id: "broken-promise",
        title: "食言",
        description: "答应陪她逛街，你临时说有事",
        initialAnger: 50,
      },
      {
        id: "forgot-anniversary",
        title: "忘记纪念日",
        description: "你们在一起一周年，你完全忘了",
        initialAnger: 65,
      },
      {
        id: "compare-ex",
        title: "和前任比较",
        description: "你不小心说了'前任不会这样'",
        initialAnger: 70,
      },
      {
        id: "bad-friends",
        title: "她不喜欢你的朋友",
        description: "你和朋友出去，没带她，她说很介意",
        initialAnger: 55,
      },
      {
        id: "phone-hidden",
        title: "手机藏起来",
        description: "她想看你手机，你条件反射藏起来了",
        initialAnger: 60,
      },
      {
        id: "work-travel",
        title: "经常出差",
        description: "这几个月经常出差，陪伴她的时间很少",
        initialAnger: 50,
      },
      {
        id: "bad-habit",
        title: "坏习惯不改",
        description: "她说过很多次让你改的坏习惯，你一直没改",
        initialAnger: 55,
      },
    ],
  },
  hard: {
    name: "高级难度",
    description: "非常棘手，需要高超技巧",
    maxRounds: 12,
    scenarios: [
      {
        id: "missed-call-important",
        title: "错过重要电话",
        description: "她有急事找你，你电话静音没接到",
        initialAnger: 70,
      },
      {
        id: "female-friend",
        title: "和异性朋友聊天",
        description: "她发现你和一位女同事聊天很频繁",
        initialAnger: 75,
      },
      {
        id: "forgot-meet-parents",
        title: "忘记见家长",
        description: "约好周末见父母，你临时忘了",
        initialAnger: 80,
      },
      {
        id: "money-issue",
        title: "金钱纠纷",
        description: "她借给你一大笔钱，你一直没提",
        initialAnger: 70,
      },
      {
        id: "bad-manners",
        title: "当众让她难堪",
        description: "在朋友面前开了个过分的玩笑",
        initialAnger: 75,
      },
      {
        id: "broken-item",
        title: "弄坏她的东西",
        description: "不小心弄坏了她很珍惜的东西",
        initialAnger: 70,
      },
      {
        id: "wrong-word",
        title: "说了很伤人的话",
        description: "吵架时你说了很伤人的话",
        initialAnger: 85,
      },
      {
        id: "meet-ex",
        title: "和前任见面",
        description: "你瞒着她和前任见面被她发现了",
        initialAnger: 90,
      },
      {
        id: "bad-attitude",
        title: "态度很差",
        description: "她觉得你这段时间对她态度很冷淡",
        initialAnger: 75,
      },
      {
        id: "trust-broken",
        title: "信任危机",
        description: "她发现你隐瞒了一件重要的事",
        initialAnger: 85,
      },
    ],
  },
};

export type Difficulty = "easy" | "medium" | "hard";

export const VOICE_OPTIONS = [
  { id: "zh_female_meilinvyou_saturn_bigtts", name: "温柔女声", description: "甜美温柔的女朋友声音" },
  { id: "zh_female_xiaohe_uranus_bigtts", name: "俏皮女声", description: "活泼俏皮的女声" },
  { id: "saturn_zh_female_keainvsheng_tob", name: "可爱女声", description: "可爱软萌的女友声音" },
  { id: "zh_female_vv_uranus_bigtts", name: "知性女声", description: "温柔知性的女声" },
];
