package rules

import "fmt"

func hs(lo, hi int) []string {
	out := make([]string, 0, hi-lo+1)
	for n := lo; n <= hi; n++ {
		out = append(out, fmt.Sprintf("H%03d", n))
	}
	return out
}

func isRefusal(v string) bool {
	return v == "avoid" || v == "no"
}

func (a AnswerMap) missingOrUnknown(id string) bool {
	return !a.Has(id) || a.IsUnknown(id)
}

// BranchPlan 返回当前应出现的隐藏题，顺序为 C→S→N→T→P。基础 60 题未处理完时不触发。
func BranchPlan(a AnswerMap) []string {
	if !a.Processed(BaseIDs()) {
		return nil
	}
	out := make([]string, 0, 40)
	activate := func(lo, hi int, next func() bool, nextLo, nextHi int) {
		stage := hs(lo, hi)
		out = append(out, stage...)
		if a.Processed(stage) && next() {
			out = append(out, hs(nextLo, nextHi)...)
		}
	}

	if QuickCourage(a, false) == "" {
		activate(1, 4, func() bool { return QuickCourage(a, true) == "" }, 5, 8)
	}

	scores := Scores(a)
	intensity, iOK := scores["intensity"]
	movement, mOK := scores["movement"]
	highI := iOK && above(intensity, 60)
	highM := mOK && above(movement, 60)

	anyRefusal, anyUnknown, anyNo := false, false, false
	for n := 51; n <= 55; n++ {
		id := fmt.Sprintf("B%03d", n)
		if v, ok := a.Enum(id); ok && isRefusal(v) {
			anyRefusal = true
		}
		if v, ok := a.Enum(id); ok && v == "no" {
			anyNo = true
		}
		if a.missingOrUnknown(id) {
			anyUnknown = true
		}
	}
	b051, b051OK := a.Enum("B051")
	b052, _ := a.Enum("B052")
	if (highI && anyRefusal) || (highM && func() bool { v, ok := a.Enum("B051"); return ok && isRefusal(v) }()) ||
		(b051OK && (b051 == "love" || b051 == "accept")) || b052 == "no" || anyUnknown {
		activate(9, 12, func() bool {
			for _, q := range hs(9, 12) {
				if a.missingOrUnknown(q) {
					return true
				}
				if v, ok := a.Enum(q); ok && isRefusal(v) {
					return true
				}
			}
			if highI && anyNo {
				return true
			}
			if highM {
				for _, q := range []string{"H009", "H010"} {
					if v, ok := a.Enum(q); ok && isRefusal(v) {
						return true
					}
				}
			}
			return false
		}, 13, 16)
	}

	narrative := Ambiguous(a, "narrative")
	if !narrative {
		for _, q := range []string{"B036", "B037"} {
			if v, ok := a.Likert(q); ok && v >= 4 {
				narrative = true
				break
			}
		}
	}
	if !narrative {
		for _, q := range []string{"B038", "B039", "B040"} {
			v, ok := a.Likert(q)
			if !ok || v <= 3 {
				narrative = true
				break
			}
		}
	}
	if narrative {
		activate(17, 20, func() bool {
			if v, ok := a.Enum("H020"); !ok || v != "yes" {
				return true
			}
			if v, ok := a.Enum("H018"); ok && v == "anytime" {
				return true
			}
			h017, _ := a.Enum("H017")
			h018, _ := a.Enum("H018")
			if h017 == "quiet" && (h018 == "open_interaction" || h018 == "anytime") {
				return true
			}
			for _, q := range hs(17, 20) {
				if a.missingOrUnknown(q) {
					return true
				}
			}
			return false
		}, 21, 24)
	}

	team := false
	if v, ok := a.Enum("B056"); !ok || v == "accompany" || v == "as_needed" {
		team = true
	}
	if v, ok := a.Likert("B031"); ok && v <= 3 {
		team = true
	}
	for _, q := range []string{"B032", "B033"} {
		if v, ok := a.Likert(q); ok && v >= 4 {
			team = true
		}
	}
	for n := 30; n <= 33; n++ {
		if _, ok := a.Likert(fmt.Sprintf("B%03d", n)); !ok {
			team = true
		}
	}
	if team {
		activate(25, 28, func() bool {
			if v, ok := a.Enum("H025"); ok && (v == "accompany" || v == "lead_rear") {
				return true
			}
			if v, ok := a.Enum("H026"); !ok || v != "none" {
				return true
			}
			if v, ok := a.Enum("H027"); ok && v == "first" {
				return true
			}
			for _, q := range hs(25, 28) {
				if a.missingOrUnknown(q) {
					return true
				}
			}
			return false
		}, 29, 32)
	}

	for i, axis := range FiveAxes[:4] {
		if Ambiguous(a, axis) {
			out = append(out, hs(33+2*i, 34+2*i)...)
		}
	}

	seen := map[string]bool{}
	for _, id := range out {
		if seen[id] {
			panic("branch plan duplicated " + id)
		}
		seen[id] = true
	}
	if len(out) > 40 {
		panic("branch plan exceeded 40")
	}
	return out
}

// BranchOf 返回隐藏题所属分支。基础题返回空字符串。
func BranchOf(id string) string {
	switch {
	case id >= "H001" && id <= "H008":
		return "C"
	case id >= "H009" && id <= "H016":
		return "S"
	case id >= "H017" && id <= "H024":
		return "N"
	case id >= "H025" && id <= "H032":
		return "T"
	case id >= "H033" && id <= "H040":
		return "P"
	default:
		return ""
	}
}
