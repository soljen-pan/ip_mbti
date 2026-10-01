package rules

// SceneWeights 是演绎场和黑追场的五轴权重，顺序与 FiveAxes 一致。
var SceneWeights = map[string][]float64{
	"immersive": {0.25, 0.30, 0.20, 0.20, 0.05},
	"chase":     {0.10, 0.10, 0.15, 0.35, 0.30},
}

// PairScore 计算基础同频分。覆盖不足或场景必需轴缺失时没有分数。
func PairScore(left, right map[string]float64, scene string) (float64, float64, bool) {
	weights, ok := SceneWeights[scene]
	if !ok {
		return 0, 0, false
	}
	required := []string{"interaction", "focus"}
	if scene == "chase" {
		required = []string{"intensity", "movement"}
	}
	common := map[string]bool{}
	coverage := 0.0
	for i, axis := range FiveAxes {
		_, lok := left[axis]
		_, rok := right[axis]
		if lok && rok {
			common[axis] = true
			coverage += weights[i]
		}
	}
	for _, axis := range required {
		if !common[axis] {
			return 0, coverage, false
		}
	}
	if coverage < 0.8-1e-9 {
		return 0, coverage, false
	}
	total := 0.0
	for i, axis := range FiveAxes {
		if !common[axis] {
			continue
		}
		diff := left[axis] - right[axis]
		if diff < 0 {
			diff = -diff
		}
		total += weights[i] * (100 - diff)
	}
	return total / coverage, coverage, true
}
