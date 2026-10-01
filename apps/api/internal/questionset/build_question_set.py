#!/usr/bin/env python3
"""把规格题干写成 question_set.json。题干必须与规格原文一致。"""

import json
from pathlib import Path

L5 = "L5"
ACCEPT = "ACCEPT"

def b(n, text, scale, reverse=False, module="preference"):
    return {
        "id": f"B{n:03d}",
        "text": text,
        "input": "likert" if module != "play" or n != 56 else "one",
        "option_set": L5 if n != 56 and not (51 <= n <= 55) else ("ACCEPT" if n < 56 else "B056"),
        "reverse": reverse,
        "scale": scale,
        "activation": "base",
        "module": module,
    }

def fix_play(q, n):
    if 51 <= n <= 55:
        q["input"] = "accept"
        q["option_set"] = "ACCEPT"
    return q

BASE = [
    b(1, "NPC向全队开放提问时，我通常想主动接话。", "interaction"),
    b(2, "有可选的角色扮演环节时，我希望有自己的表达机会。", "interaction"),
    b(3, "我享受与NPC来回对话，让互动持续一会儿。", "interaction"),
    b(4, "即使有充分发言机会，我也更喜欢在旁观察别人如何互动。", "interaction", True),
    b(5, "相比承担长段角色对话，我更喜欢不需要频繁开口的参与方式。", "interaction", True),
    b(6, "当故事与操作环节需要取舍时，我通常更想完整体验故事。", "focus"),
    b(7, "选择主题时，人物关系和故事设定比机关数量更吸引我。", "focus"),
    b(8, "即使暂时没有操作任务，精彩演绎也能让我满足。", "focus"),
    b(9, "比起较长的演绎，我更希望尽快出现可亲手完成的任务。", "focus", True),
    b(10, "如果时间有限，我更愿意多玩一项任务，少看一段非关键演绎。", "focus", True),
    b(11, "明确知道下一步目标，会让我更享受过程。", "route"),
    b(12, "相比同时开放多个方向，我更喜欢线索逐步展开的路线。", "route"),
    b(13, "主线与可选探索同时出现时，我通常更想先推进主线。", "route"),
    b(14, "在明确允许探索的区域，我喜欢寻找主线之外的发现。", "route", True),
    b(15, "可以自行决定任务顺序，会增加我的乐趣。", "route", True),
    b(16, "在场馆和身体条件允许时，我通常想选择较刺激的体验档位。", "intensity"),
    b(17, "紧张和压迫的过程本身就是我期待的乐趣。", "intensity"),
    b(18, "即使不用跑动，我也喜欢较强的恐怖氛围。", "intensity"),
    b(19, "相比持续紧张，我更喜欢强度温和、可调节的体验。", "intensity", True),
    b(20, "其他内容相同时，我更愿意选择突发惊吓较少的版本。", "intensity", True),
    b(21, "假设惊吓可接受，跑动和躲避本身会增加我的乐趣。", "movement"),
    b(22, "同一任务能用静态操作或身体行动完成时，我更想选身体行动。", "movement"),
    b(23, "即使没有恐怖元素，我也喜欢限时移动和躲避的玩法。", "movement"),
    b(24, "即使不会害怕、也不会太累，我仍更愿意选择少跑动的版本。", "movement", True),
    b(25, "其他内容相同时，我更愿意选择整场活动量较低的版本。", "movement", True),
    b(26, "即使暂时没有我的任务，我也会持续关注人物之间发生了什么。", "immersion", module="engagement"),
    b(27, "我喜欢从自己扮演角色的处境理解事件。", "immersion", module="engagement"),
    b(28, "体验过程中，我通常很少产生角色代入感。", "immersion", True, "engagement"),
    b(29, "即使演绎很吸引人，我仍更习惯作为故事外的旁观者。", "immersion", True, "engagement"),
    b(30, "发现关键线索时，我愿意及时与队友分享。", "cooperation", module="engagement"),
    b(31, "我和队友都想参加同一环节时，我愿意协商或轮流。", "cooperation", module="engagement"),
    b(32, "即使别人也想尝试，我仍更想自己连续完成喜欢的互动。", "cooperation", True, "engagement"),
    b(33, "调整玩法会减少我的乐趣时，我通常不太愿意为共同节奏作调整。", "cooperation", True, "engagement"),
    b(34, "与NPC对话时，我喜欢按自己在故事中的身份回应。", "narrative", module="narrative"),
    b(35, "即使想开玩笑，我也更喜欢使用符合当前世界观的说法。", "narrative", module="narrative"),
    b(36, "对我来说，用现实生活和网络中的梗回应NPC是重要乐趣。", "narrative", True, "narrative"),
    b(37, "相比一直保持角色身份，我更喜欢穿插现实中的吐槽。", "narrative", True, "narrative"),
    b(38, "想到题外话时，我通常愿意等关键演绎结束后再分享。", "timing", module="narrative"),
    b(39, "NPC将话题引回故事时，我愿意跟随这个方向继续互动。", "timing", module="narrative"),
    b(40, "队友表示想认真看完这段时，我愿意暂停插话。", "timing", module="narrative"),
    b(41, "任务需要我独自进入有恐怖氛围的房间时，即使没人陪同，我通常也会接下任务。", "D", module="courage"),
    b(42, "队友因为害怕不敢做任务时，我通常敢陪着对方进入任务区域。", "D", module="courage"),
    b(43, "队伍经过可能出现NPC的区域时，我会因为害怕而尽量待在前后都有人的位置。", "D", True, "courage"),
    b(44, "即使任务步骤已经清楚，只要需要独自面对惊吓，我通常还是不敢接。", "D", True, "courage"),
    b(45, "NPC突然出现时，我内心会明显害怕，即使外表没有表现出来。", "F", module="courage"),
    b(46, "一次突然的声音惊吓结束后，我通常还会害怕一阵子。", "F", module="courage"),
    b(47, "知道是密室表演时，即使NPC努力营造压迫感，我心里通常也很平静。", "F", True, "courage"),
    b(48, "突然被吓到时，我的第一反应经常是叫出声。", "E", module="courage"),
    b(49, "昏暗环境中出现一点意外声响，我也容易忍不住叫出来。", "E", module="courage"),
    b(50, "即使心里很害怕，我也常常安静、僵住或想说却说不出来。", "E", True, "courage"),
]

play_stems = [
    (51, "NPC追逐。", "chase"),
    (52, "NPC在场馆规则允许范围内的近距离贴脸惊吓。", "close_scare"),
    (53, "在恐怖情境下独自完成任务。", "solo_task"),
    (54, "突然出现的人影或声音惊吓。", "jump_scare"),
    (55, "黑暗环境中的活动。", "darkness"),
]
for n, text, field in play_stems:
    q = b(n, text, field, module="play")
    BASE.append(fix_play(q, n))

BASE.append(b(56, "面对令你害怕的任务，你通常希望怎样安排？", "support_need", module="play"))
BASE[-1]["input"] = "one"
BASE[-1]["option_set"] = "B056"

EMO = [
    b(0, "", "", module="emotion"),
]
# E questions are not B-ids; build explicitly.
EMOTIONS = [
    ("E001", "角色面临失去、告别或艰难选择时，我容易跟着他的处境产生情绪起伏。", "story_emotion", False),
    ("E002", "即使能理解角色的处境，观看现场剧情时，我的情绪通常仍比较平稳。", "story_emotion", True),
    ("E003", "现场演绎中的离别、牺牲或重逢情节，常会让我眼眶发热或落泪。", "story_tears", False),
    ("E004", "剧情即使打动了我，我在现场通常也不容易掉眼泪。", "story_tears", True),
]

def likert(id, text, scale, reverse, module, activation="base", branch=""):
    return {
        "id": id, "text": text, "input": "likert", "option_set": "L5",
        "reverse": reverse, "scale": scale, "activation": activation,
        "module": module, "branch": branch,
    }

def one(id, text, option_set, module, activation="hidden", branch="", depends=None, by_parent=False):
    item = {
        "id": id, "text": text, "input": "one", "option_set": option_set,
        "reverse": False, "scale": "", "activation": activation,
        "module": module, "branch": branch,
    }
    if depends:
        item["depends_on"] = depends
    return item

def accept(id, text, scale, branch):
    return {
        "id": id, "text": text, "input": "accept", "option_set": "ACCEPT",
        "reverse": False, "scale": scale, "activation": "hidden",
        "module": "branch", "branch": branch,
    }

HIDDEN = [
    likert("H001", "即使会害怕，如果需要有人先进入任务区域，我通常仍敢先走。", "D", False, "branch", "hidden", "C"),
    likert("H002", "经过可能突然出现NPC的通道时，如果需要我走在最后，我通常会因为害怕而拒绝。", "D", True, "branch", "hidden", "C"),
    likert("H003", "还没有被真正吓到，只是等待NPC可能出现，我心里就已经很害怕。", "F", False, "branch", "hidden", "C"),
    likert("H004", "NPC突然接近时，我经常忍不住尖叫或大声喊队友。", "E", False, "branch", "hidden", "C"),
    one("H005", "在同一类惊吓情境、任务适合身体条件且不包含明确拒绝项目时，如果没人陪，你更常怎样做？", "H005", "branch", "hidden", "C"),
    one("H006", "在刚才同一类情境中，你内心更常是什么状态？", "H006", "branch", "hidden", "C"),
    one("H007", "在刚才同一类情境中，你受惊时更常如何表达？", "H007", "branch", "hidden", "C"),
    one("H008", "综合同一情境，以下哪种反应更接近你通常的表现？", "H008", "branch", "hidden", "C", ["H005"]),
    accept("H009", "对短距离快速跑动，你通常是什么态度？", "sprint", "S"),
    accept("H010", "对多次跑动或持续活动，你通常是什么态度？", "repeated_movement", "S"),
    accept("H011", "对蹲行、爬行类动作，你通常是什么态度？", "crouch_crawl", "S"),
    accept("H012", "对场馆提前说明的身体接触，你通常是什么态度？", "contact", "S"),
    one("H013", "如果有NPC追逐，你更希望怎样安排？", "H013", "branch", "hidden", "S"),
    one("H014", "本次想优先寻找哪种刺激强度？", "H014", "branch", "hidden", "S"),
    one("H015", "本次想优先寻找哪种活动量？", "H015", "branch", "hidden", "S"),
    one("H016", "你希望用哪种方式处理超出预期的惊吓？", "H016", "branch", "hidden", "S"),
    one("H017", "关键演绎期间，你希望队友怎样交流？", "H017", "branch", "hidden", "N"),
    one("H018", "你自己最希望在哪个时段玩现实梗？", "H018", "branch", "hidden", "N"),
    one("H019", "本场你希望获得多少直接接戏机会？", "H019", "branch", "hidden", "N"),
    one("H020", "有其他玩家也想接同一段互动时，你愿意轮流吗？", "H020", "branch", "hidden", "N"),
    one("H021", "严肃独白中想到一个现实笑点，你更常怎样做？", "H021", "branch", "hidden", "N"),
    one("H022", "NPC把话题引回故事时，你更愿意怎样继续？", "H022", "branch", "hidden", "N"),
    one("H023", "有人明确说“我想安静看完这段”时，你会怎样做？", "H023", "branch", "hidden", "N"),
    one("H024", "你是否愿意本场约定“关键演绎保持故事氛围，剧外玩梗放到同意的时段”？", "H024", "branch", "hidden", "N"),
    one("H025", "如果队友需要陪同，你本场愿意提供哪种支持？", "H025", "branch", "hidden", "T"),
    one("H026", "自己需要支持时，你希望对方怎样帮助？", "H026", "branch", "hidden", "T"),
    one("H027", "两个人都想参与的环节，你更希望怎样分配？", "H027", "branch", "hidden", "T"),
    one("H028", "一方想探索、另一方想推进时，你更希望怎样安排？", "H028", "branch", "hidden", "T"),
    one("H029", "提供陪同时，你本场愿意承担多长时间？", "H029", "branch", "hidden", "T"),
    one("H030", "如果同时有两位队友需要你去不同房间陪同，你希望怎样处理？", "H030", "branch", "hidden", "T"),
    one("H031", "有人明确表示“暂停，我不想继续”时，你通常怎样做？", "H031", "branch", "hidden", "T"),
    one("H032", "你是否愿意在开场前确认自己的任务、陪同对象和暂停方式？", "H032", "branch", "hidden", "T"),
    likert("H033", "熟悉角色背景后，如果NPC向我开放对话，我希望多回应几轮。", "interaction", False, "branch", "hidden", "P"),
    likert("H034", "即使知道该说什么，我仍更愿意把主要对话留给别人。", "interaction", True, "branch", "hidden", "P"),
    likert("H035", "如果只能保留一个环节，我更想保留完整的人物故事。", "focus", False, "branch", "hidden", "P"),
    likert("H036", "即使故事不错，我也更希望增加能亲手操作的任务。", "focus", True, "branch", "hidden", "P"),
    likert("H037", "比起自由寻找方向，我更希望每个阶段都有清楚目标。", "route", False, "branch", "hidden", "P"),
    likert("H038", "即使主线已经明确，我也想尝试被允许的额外路线。", "route", True, "branch", "hidden", "P"),
    likert("H039", "假设没有跑动，我仍期待持续一些的恐怖压迫氛围。", "intensity", False, "branch", "hidden", "P"),
    likert("H040", "即使完全不用做任务，我也更偏好温和而非持续紧张的氛围。", "intensity", True, "branch", "hidden", "P"),
]

for q in BASE:
    q.setdefault("branch", "")
for n, q in enumerate(BASE, start=1):
    if q["module"] == "preference" and "branch" not in q:
        q["branch"] = ""

emotions = [likert(i, t, s, r, "emotion") for i, t, s, r in EMOTIONS]

opt = lambda value, label: {"value": value, "label": label}
OPTIONS = {
    "L5": [opt(1, "非常不符合"), opt(2, "比较不符合"), opt(3, "居中 / 看情况"), opt(4, "比较符合"), opt(5, "非常符合"), opt("unknown", "无法判断")],
    "ACCEPT": [opt("love", "喜欢"), opt("accept", "可以接受"), opt("avoid", "尽量避免"), opt("no", "不接受"), opt("unknown", "无法判断")],
    "B056": [opt("independent", "独立尝试"), opt("accompany", "希望有人陪同"), opt("as_needed", "先尝试，必要时求助"), opt("unknown", "无法判断")],
    "H005": [opt("independent", "即使害怕也独自接下尝试"), opt("accompanied", "需要陪同才敢做，否则倾向不接"), opt("unknown", "无法判断")],
    "H006": [opt("calm", "基本不怕"), opt("fear", "会明显害怕"), opt("mixed", "随环节变化"), opt("unknown", "无法判断")],
    "H007": [opt("vocal", "叫出声"), opt("quiet", "安静或失声"), opt("mixed", "两种都常见"), opt("unknown", "无法判断")],
    "H013": [opt("none", "不参加"), opt("optional", "可选择参加"), opt("required", "接受本人必做"), opt("unknown", "无法判断")],
    "H014": [opt("low", "低"), opt("medium", "中"), opt("high", "高"), opt("unknown", "无法判断")],
    "H015": [opt("low", "低"), opt("medium", "中"), opt("high", "高"), opt("unknown", "无法判断")],
    "H016": [opt("reduce", "事先安排可降低强度"), opt("exit", "需要可退出路径"), opt("check", "先了解具体环节再决定"), opt("unknown", "无法判断")],
    "H017": [opt("quiet", "安静观演"), opt("in_world", "适时剧内回应"), opt("open", "可接受题外评论"), opt("unknown", "无法判断")],
    "H018": [opt("none", "不主动玩"), opt("break", "休息或演绎结束"), opt("open_interaction", "开放互动时"), opt("anytime", "任何时段"), opt("unknown", "无法判断")],
    "H019": [opt("low", "少量"), opt("some", "适量"), opt("high", "较多"), opt("unknown", "无法判断")],
    "H020": [opt("yes", "愿意"), opt("no", "不愿意"), opt("unknown", "无法判断")],
    "H021": [opt("later", "结束再说"), opt("in_world", "等开放互动再改成剧内说法"), opt("whisper", "立即小声告诉队友"), opt("say", "立即说出来"), opt("unknown", "无法判断")],
    "H022": [opt("follow", "跟随故事"), opt("ask_window", "询问何时可自由聊"), opt("continue", "继续自己的题外话"), opt("unknown", "无法判断")],
    "H023": [opt("pause", "暂停题外交流"), opt("discuss_after", "结束再协商"), opt("continue", "继续表达"), opt("unknown", "无法判断")],
    "H024": [opt("yes", "愿意"), opt("no", "不愿意"), opt("unknown", "无法判断")],
    "H025": [opt("accompany", "愿意陪同"), opt("lead_rear", "愿意带路或殿后"), opt("check_only", "只愿意帮忙确认信息"), opt("none", "暂不提供"), opt("unknown", "无法判断")],
    "H026": [opt("always", "任务期间一直陪同"), opt("checkpoints", "在关键位置等候"), opt("on_request", "我求助时再来"), opt("none", "不需要"), opt("unknown", "无法判断")],
    "H027": [opt("rotate", "轮流"), opt("choose", "分开选择"), opt("first", "优先我参与"), opt("unknown", "无法判断")],
    "H028": [opt("timebox", "约定探索时间"), opt("split", "场馆允许时分工"), opt("uniform", "保持全队一致"), opt("unknown", "无法判断")],
    "H029": [opt("one", "只一个事先约定任务"), opt("selected", "几个指定任务"), opt("throughout", "可商量全程"), opt("none", "不提供"), opt("unknown", "无法判断")],
    "H030": [opt("reschedule", "先协商错开或更换安排"), opt("one", "只承诺一个"), opt("all", "声称都可以"), opt("unknown", "无法判断")],
    "H031": [opt("stop", "先停下再协商"), opt("check_once", "确认一次后尊重"), opt("keep_persuading", "继续劝说"), opt("unknown", "无法判断")],
    "H032": [opt("yes", "愿意"), opt("no", "不愿意"), opt("unknown", "无法判断")],
}

doc = {
    "question_version": "adaptive-2.1",
    "score_version": "score-2.1",
    "branch_version": "branch-2.1",
    "copy_version": "copy-2.1",
    "prompts": {
        "opening": "基础60题，你的选择可能开启补充情境，完整测试最多100题，可随时暂停。按自己通常怎样玩来答，不必选择看起来更好的答案。",
        "courage": "以下问面对惊吓时通常怎样反应，不是想不想体验刺激。想象任务适合身体条件、规则允许、不包含你明确拒绝的项目；参考同一类昏暗、突发声响和NPC出现的场景。没经验可以想象，也可以选无法判断。",
        "emotion": "请按看现场故事演绎时通常的反应回答，不按NPC突然惊吓、疼痛、身体不适或“别人期望你感动”的情况作答。此处问反应，不评价是否懂剧情、是否善良，也不暗示哭过的人适合悲伤主题。",
        "play_prefix": "对于以下体验，你通常是什么态度？",
    },
    "h008_by_parent": {
        "independent": [opt("G", "心里基本不怕也不太叫，任务照做"), opt("M", "会怕或会叫，但仍敢做任务"), opt("unknown", "无法判断")],
        "accompanied": [opt("S", "害怕时容易叫出声，需要陪同"), opt("Q", "害怕时安静或失声，需要陪同"), opt("unknown", "无法判断")],
    },
    "option_sets": OPTIONS,
    "questions": BASE + emotions + HIDDEN,
}

ids = [q["id"] for q in doc["questions"]]
assert len(ids) == 100, len(ids)
assert len(set(ids)) == 100
assert ids[:56] == [f"B{n:03d}" for n in range(1, 57)]
assert [q["id"] for q in emotions] == ["E001", "E002", "E003", "E004"]
assert [q["id"] for q in HIDDEN] == [f"H{n:03d}" for n in range(1, 41)]
out = Path(__file__).with_name("question_set.json")
out.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(out, len(ids))
