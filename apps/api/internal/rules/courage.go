package rules

func courageSpecs(extended bool) map[string]ScaleSpec {
	d := []Item{{"B041", false}, {"B042", false}, {"B043", true}, {"B044", true}}
	f := []Item{{"B045", false}, {"B046", false}, {"B047", true}}
	e := []Item{{"B048", false}, {"B049", false}, {"B050", true}}
	if extended {
		d = append(d, Item{"H001", false}, Item{"H002", true})
		f = append(f, Item{"H003", false})
		e = append(e, Item{"H004", false})
	}
	return map[string]ScaleSpec{
		"D": {d, 4, 1, 1},
		"F": {f, 3, 1, 1},
		"E": {e, 3, 1, 1},
	}
}

// CourageScores 只服务坦奶分类，不进入五轴匹配分。
func CourageScores(a AnswerMap, extended bool) map[string]float64 {
	out := map[string]float64{}
	for name, spec := range courageSpecs(extended) {
		if v, ok := Scale(a, spec); ok {
			out[name] = v
		}
	}
	return out
}

// QuickCourage 返回 G/M/S/Q。信息不足、落在中间或内外反应不一致时返回空字符串。
func QuickCourage(a AnswerMap, extended bool) string {
	c := CourageScores(a, extended)
	d, dOK := c["D"]
	f, fOK := c["F"]
	e, eOK := c["E"]
	if !dOK || !fOK || !eOK {
		return ""
	}
	if b041, ok := a.Likert("B041"); ok {
		if (above(d, 60) && b041 <= 2) || (below(d, 40) && b041 >= 4) {
			return ""
		}
	}
	if above(d, 60) {
		if atMost(f, 25) && atMost(e, 25) {
			return "G"
		}
		if above(f, 25) && above(e, 25) {
			return "M"
		}
		return ""
	}
	if below(d, 40) {
		if above(e, 60) {
			return "S"
		}
		if below(e, 40) {
			return "Q"
		}
	}
	return ""
}

// CourageResult 是坦奶分类。Code 只是内部分类短码，展示时要换成 subtype。
type CourageResult struct {
	Status   string
	Code     string
	Source   string
	Required []string
}

type CourageView struct {
	Status         string   `json:"status"`
	Subtype        string   `json:"subtype,omitempty"`
	Code           string   `json:"code,omitempty"`
	Group          string   `json:"group,omitempty"`
	Basis          string   `json:"basis,omitempty"`
	DecisionSource string   `json:"decision_source,omitempty"`
	RequiredIDs    []string `json:"required_ids,omitempty"`
	Notices        []string `json:"notices,omitempty"`
}

var courageViewOf = map[string]CourageView{
	"G": {Subtype: "giant_tank", Code: "T-G", Group: "tank"},
	"M": {Subtype: "micro_tank", Code: "T-M", Group: "tank"},
	"S": {Subtype: "screaming_milk", Code: "N-S", Group: "milk"},
	"Q": {Subtype: "silent_milk", Code: "N-Q", Group: "milk"},
}

// ClassifyCourage 先用基础分，再用 C 线补证，最后才接受 H005/H008 的情境确认。
func ClassifyCourage(a AnswerMap) CourageResult {
	if base := QuickCourage(a, false); base != "" {
		return CourageResult{Status: "resolved", Code: base, Source: "base"}
	}
	stage1 := hs(1, 4)
	if !a.Processed(stage1) {
		return CourageResult{Status: "pending", Required: stage1}
	}
	if ext := QuickCourage(a, true); ext != "" {
		return CourageResult{Status: "resolved", Code: ext, Source: "branch_evidence"}
	}
	h005, ok := a.Enum("H005")
	if !ok {
		return CourageResult{Status: "pending", Required: []string{"H005", "H008"}}
	}
	allowed := allowedH008(h005)
	if allowed == nil {
		return CourageResult{Status: "pending", Required: []string{"H005", "H008"}}
	}
	h008, ok := a.Enum("H008")
	if !ok || !contains(allowed, h008) {
		return CourageResult{Status: "pending", Required: []string{"H008"}}
	}
	return CourageResult{Status: "resolved", Code: h008, Source: "scenario_confirmation"}
}

func allowedH008(h005 string) []string {
	switch h005 {
	case "independent":
		return []string{"G", "M"}
	case "accompanied":
		return []string{"S", "Q"}
	default:
		return nil
	}
}

// LegalH008 判断子类是否落在 H005 父类内。父类还没答时，H008 不能先提交。
func LegalH008(h005, h008 string) bool {
	return contains(allowedH008(h005), h008)
}

func CouragePublic(result CourageResult, basis string) CourageView {
	if result.Status != "resolved" {
		return CourageView{Status: "pending", RequiredIDs: result.Required, Basis: basis, Notices: []string{}}
	}
	view := courageViewOf[result.Code]
	view.Status = "resolved"
	view.Basis = basis
	view.DecisionSource = result.Source
	view.Notices = []string{}
	return view
}

func contains(list []string, item string) bool {
	for _, v := range list {
		if v == item {
			return true
		}
	}
	return false
}
