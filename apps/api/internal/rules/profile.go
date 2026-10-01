package rules

// Letter 是单轴展示。基础分恰好为 50 时 Base 为空；前四轴可凭 P 题给出参考字母，不回写分数。
type Letter struct {
	Score    *float64 `json:"score"`
	Base     *string  `json:"base_letter"`
	Display  string   `json:"display_letter"`
	Flexible bool     `json:"flexible"`
	Source   string   `json:"letter_source"`
}

var highLetter = map[string]string{
	"interaction": "A", "focus": "D", "route": "L", "intensity": "H", "movement": "K",
}
var lowLetter = map[string]string{
	"interaction": "O", "focus": "M", "route": "V", "intensity": "C", "movement": "R",
}

var pPairs = map[string][]Item{
	"interaction": {{"H033", false}, {"H034", true}},
	"focus":       {{"H035", false}, {"H036", true}},
	"route":       {{"H037", false}, {"H038", true}},
	"intensity":   {{"H039", false}, {"H040", true}},
}

// Letters 生成五轴字母。分数缺失时展示问号，不用 P 题填补缺失分。
func Letters(a AnswerMap) map[string]Letter {
	scores := Scores(a)
	out := make(map[string]Letter, len(FiveAxes))
	for _, axis := range FiveAxes {
		out[axis] = letterFor(a, axis, scores)
	}
	return out
}

func letterFor(a AnswerMap, axis string, scores map[string]float64) Letter {
	score, ok := scores[axis]
	if !ok {
		return Letter{Display: "?", Source: "unknown"}
	}
	copied := score
	letter := Letter{Score: &copied, Source: "base"}
	switch {
	case near(score, 50):
		letter.Flexible = true
		letter.Display = "?"
		letter.Source = "unknown"
		if dir, ok := pDirection(a, axis); ok {
			letter.Display = dir
			letter.Source = "context_reference"
		}
	case above(score, 50):
		base := highLetter[axis]
		letter.Base = &base
		letter.Display = base
		letter.Flexible = atMost(score, 60)
	default:
		base := lowLetter[axis]
		letter.Base = &base
		letter.Display = base
		letter.Flexible = atLeast(score, 40)
	}
	return letter
}

func pDirection(a AnswerMap, axis string) (string, bool) {
	items, ok := pPairs[axis]
	if !ok {
		return "", false
	}
	vals := standardized(a, items)
	if len(vals) != 2 {
		return "", false
	}
	if vals[0] >= 4 && vals[1] >= 4 {
		return highLetter[axis], true
	}
	if vals[0] <= 2 && vals[1] <= 2 {
		return lowLetter[axis], true
	}
	return "", false
}

// FullType 在五个展示字母都确定时返回 ADLH-K 这种代码。
func FullType(letters map[string]Letter) (string, bool) {
	parts := make([]string, 0, 5)
	for _, axis := range FiveAxes {
		display := letters[axis].Display
		if len(display) != 1 || display == "?" {
			return "", false
		}
		parts = append(parts, display)
	}
	return parts[0] + parts[1] + parts[2] + parts[3] + "-" + parts[4], true
}

var archetypeName = map[string]string{
	"ADLH": "惊幕主角", "ADLC": "入戏旅人", "ADVH": "异境来客", "ADVC": "故事漫游者",
	"AMLH": "突围先锋", "AMLC": "机关领航员", "AMVH": "险境探路者", "AMVC": "奇境发明家",
	"ODLH": "暗幕见证者", "ODLC": "静幕听众", "ODVH": "幽境寻踪者", "ODVC": "梦境拾遗者",
	"OMLH": "静默执行者", "OMLC": "谜室观察员", "OMVH": "暗域探索者", "OMVC": "秘径勘察员",
}

// TypeName 把 32 个正式代码换成展示名。运动字母只改动能型或缓行型。
func TypeName(full string) (string, bool) {
	if len(full) != 6 || full[4] != '-' {
		return "", false
	}
	base, ok := archetypeName[full[:4]]
	if !ok {
		return "", false
	}
	switch full[5] {
	case 'K':
		return base + "·动能型", true
	case 'R':
		return base + "·缓行型", true
	default:
		return "", false
	}
}

type StoryAxis struct {
	Score       *float64 `json:"score"`
	Label       string   `json:"label"`
	EvidenceIDs []string `json:"evidence_ids"`
}

// StoryResponse 单独计算剧情情绪与落泪。它不改变五轴、六星或坦奶。
func StoryResponse(a AnswerMap) map[string]StoryAxis {
	out := map[string]StoryAxis{}
	for _, name := range []string{"story_emotion", "story_tears"} {
		spec := Scales[name]
		value, ok := Scale(a, spec)
		ids := make([]string, len(spec.Items))
		for i, it := range spec.Items {
			ids[i] = it.ID
		}
		axis := StoryAxis{Label: "pending", EvidenceIDs: ids}
		if !ok {
			out[name] = axis
			continue
		}
		copied := value
		axis.Score = &copied
		vals := standardized(a, spec.Items)
		switch {
		case spreadAtLeast3(vals):
			axis.Label = "context_varies"
		case above(value, 60):
			axis.Label = "higher"
		case below(value, 40):
			axis.Label = "lower"
		default:
			axis.Label = "flexible"
		}
		out[name] = axis
	}
	return out
}

type RadarPoint struct {
	Axis  string   `json:"axis"`
	Value *float64 `json:"value"`
}

// Radar 按入戏、互动、100−路线、刺激、运动、协作排列。缺失轴保持空值。
func Radar(scores map[string]float64) []RadarPoint {
	order := []struct {
		axis  string
		flip  bool
		score string
	}{
		{"immersion", false, "immersion"},
		{"interaction", false, "interaction"},
		{"route_openness", true, "route"},
		{"intensity", false, "intensity"},
		{"movement", false, "movement"},
		{"cooperation", false, "cooperation"},
	}
	out := make([]RadarPoint, 0, len(order))
	for _, item := range order {
		point := RadarPoint{Axis: item.axis}
		if v, ok := scores[item.score]; ok {
			value := v
			if item.flip {
				value = 100 - v
			}
			point.Value = &value
		}
		out = append(out, point)
	}
	return out
}
