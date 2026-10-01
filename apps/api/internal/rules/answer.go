package rules

import "fmt"

// Value 是一道已处理的题。Kind=likert 时 Likert 为 1–5；Kind=enum 时 Enum 为选项；Kind=unknown 表示无法判断。
// 答案表里没有该题 ID，才是未答。
type Value struct {
	Kind   string
	Likert int
	Enum   string
}

type AnswerMap map[string]Value

func (a AnswerMap) Has(id string) bool {
	_, ok := a[id]
	return ok
}

func (a AnswerMap) Likert(id string) (int, bool) {
	v, ok := a[id]
	if !ok || v.Kind != "likert" || v.Likert < 1 || v.Likert > 5 {
		return 0, false
	}
	return v.Likert, true
}

func (a AnswerMap) Enum(id string) (string, bool) {
	v, ok := a[id]
	if !ok || v.Kind != "enum" || v.Enum == "" || v.Enum == "unknown" {
		return "", false
	}
	return v.Enum, true
}

func (a AnswerMap) IsUnknown(id string) bool {
	v, ok := a[id]
	return ok && v.Kind == "unknown"
}

func (a AnswerMap) Processed(ids []string) bool {
	for _, id := range ids {
		if !a.Has(id) {
			return false
		}
	}
	return true
}

func (a AnswerMap) SetLikert(id string, n int) {
	a[id] = Value{Kind: "likert", Likert: n}
}

func (a AnswerMap) SetEnum(id string, enum string) {
	a[id] = Value{Kind: "enum", Enum: enum}
}

func (a AnswerMap) SetUnknown(id string) {
	a[id] = Value{Kind: "unknown"}
}

func BaseIDs() []string {
	ids := make([]string, 0, 60)
	for n := 1; n <= 56; n++ {
		ids = append(ids, fmt.Sprintf("B%03d", n))
	}
	for n := 1; n <= 4; n++ {
		ids = append(ids, fmt.Sprintf("E%03d", n))
	}
	return ids
}

func HiddenIDs() []string {
	ids := make([]string, 0, 40)
	for n := 1; n <= 40; n++ {
		ids = append(ids, fmt.Sprintf("H%03d", n))
	}
	return ids
}

func near(v, target float64) bool {
	d := v - target
	if d < 0 {
		d = -d
	}
	return d <= 1e-9
}

func above(v, target float64) bool {
	return v > target && !near(v, target)
}

func below(v, target float64) bool {
	return v < target && !near(v, target)
}

func atLeast(v, target float64) bool {
	return v > target || near(v, target)
}

func atMost(v, target float64) bool {
	return v < target || near(v, target)
}
