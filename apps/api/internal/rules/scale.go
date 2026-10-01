package rules

// Item 是一道进入均值的题。Reverse 为真时先换成 6−原值。
type Item struct {
	ID      string
	Reverse bool
}

// ScaleSpec 是一条共同量尺。Minimum 是最少有效题，MinPositive / MinReverse 是正反向各自的最少题数。
type ScaleSpec struct {
	Items       []Item
	Minimum     int
	MinPositive int
	MinReverse  int
}

func axisItems(start, count int, reverseFrom int) []Item {
	items := make([]Item, 0, count)
	for n := start; n < start+count; n++ {
		items = append(items, Item{ID: idB(n), Reverse: n >= reverseFrom})
	}
	return items
}

func idB(n int) string {
	return "B" + pad3(n)
}

func pad3(n int) string {
	if n < 10 {
		return "00" + itoa(n)
	}
	if n < 100 {
		return "0" + itoa(n)
	}
	return itoa(n)
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	var b [4]byte
	i := len(b)
	for n > 0 {
		i--
		b[i] = byte('0' + n%10)
		n /= 10
	}
	return string(b[i:])
}

// Scales 是 v2.1 共同量尺。隐藏题不在这里，避免分支题量改变五轴分数。
var Scales = map[string]ScaleSpec{
	"interaction":   {axisItems(1, 5, 4), 4, 1, 1},
	"focus":         {axisItems(6, 5, 9), 4, 1, 1},
	"route":         {axisItems(11, 5, 14), 4, 1, 1},
	"intensity":     {axisItems(16, 5, 19), 4, 1, 1},
	"movement":      {axisItems(21, 5, 24), 4, 1, 1},
	"immersion":     {axisItems(26, 4, 28), 3, 1, 1},
	"cooperation":   {axisItems(30, 4, 32), 3, 1, 1},
	"narrative":     {axisItems(34, 4, 36), 3, 1, 1},
	"timing":        {axisItems(38, 3, 999), 2, 2, 0},
	"story_emotion": {[]Item{{"E001", false}, {"E002", true}}, 2, 1, 1},
	"story_tears":   {[]Item{{"E003", false}, {"E004", true}}, 2, 1, 1},
}

var profileAxes = []string{
	"interaction", "focus", "route", "intensity", "movement",
	"immersion", "cooperation", "narrative", "timing",
	"story_emotion", "story_tears",
}

// FiveAxes 是配对和主题软分使用的五轴，顺序固定。
var FiveAxes = []string{"interaction", "focus", "route", "intensity", "movement"}

// Scale 计算 25×(有效题反向处理后的均值−1)。覆盖不足时 ok 为 false。
func Scale(a AnswerMap, spec ScaleSpec) (float64, bool) {
	sum, n, pos, rev := 0, 0, 0, 0
	for _, it := range spec.Items {
		raw, ok := a.Likert(it.ID)
		if !ok {
			continue
		}
		scored := raw
		if it.Reverse {
			scored = 6 - raw
			rev++
		} else {
			pos++
		}
		sum += scored
		n++
	}
	if n < spec.Minimum || pos < spec.MinPositive || rev < spec.MinReverse {
		return 0, false
	}
	return (float64(sum)/float64(n) - 1) * 25, true
}

// Scores 返回各共同量尺。无分数的轴不出现在结果里。
func Scores(a AnswerMap) map[string]float64 {
	out := map[string]float64{}
	for _, name := range profileAxes {
		if v, ok := Scale(a, Scales[name]); ok {
			out[name] = v
		}
	}
	return out
}

func standardized(a AnswerMap, items []Item) []int {
	vals := make([]int, 0, len(items))
	for _, it := range items {
		raw, ok := a.Likert(it.ID)
		if !ok {
			continue
		}
		if it.Reverse {
			raw = 6 - raw
		}
		vals = append(vals, raw)
	}
	return vals
}

func spreadAtLeast3(vals []int) bool {
	if len(vals) == 0 {
		return false
	}
	min, max := vals[0], vals[0]
	for _, v := range vals[1:] {
		if v < min {
			min = v
		}
		if v > max {
			max = v
		}
	}
	return max-min >= 3
}

// Ambiguous 为基础分落在 40–60、该轴没有分、或标准化后极差至少为 3。
func Ambiguous(a AnswerMap, axis string) bool {
	spec := Scales[axis]
	v, ok := Scale(a, spec)
	vals := standardized(a, spec.Items)
	if !ok || spreadAtLeast3(vals) {
		return true
	}
	return atLeast(v, 40) && atMost(v, 60)
}
