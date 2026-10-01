package rules

import "math/rand/v2"

// BaseOrder 按固定种子生成基础题顺序。B001–B033 混排且同轴最多连续 2 题；
// B034–B040、B041–B050 各自混排；B051–B056 与 E001–E004 保持题号顺序。
func BaseOrder(seed int64) []string {
	r := rand.New(rand.NewPCG(uint64(seed), 0x9e3779b97f4a7c15))
	block1 := interleave(shuffleGroups(r, [][]string{
		seqB(1, 5),
		seqB(6, 10),
		seqB(11, 15),
		seqB(16, 20),
		seqB(21, 25),
		seqB(26, 29),
		seqB(30, 33),
	}))
	block2 := shuffle(r, seqB(34, 40))
	block3 := shuffle(r, seqB(41, 50))
	out := make([]string, 0, 60)
	out = append(out, block1...)
	out = append(out, block2...)
	out = append(out, block3...)
	out = append(out, seqB(51, 56)...)
	out = append(out, "E001", "E002", "E003", "E004")
	return out
}

func seqB(from, to int) []string {
	out := make([]string, 0, to-from+1)
	for n := from; n <= to; n++ {
		out = append(out, idB(n))
	}
	return out
}

func shuffle(r *rand.Rand, ids []string) []string {
	out := append([]string(nil), ids...)
	r.Shuffle(len(out), func(i, j int) { out[i], out[j] = out[j], out[i] })
	return out
}

func shuffleGroups(r *rand.Rand, groups [][]string) [][]string {
	out := make([][]string, len(groups))
	for i, g := range groups {
		out[i] = shuffle(r, g)
	}
	r.Shuffle(len(out), func(i, j int) { out[i], out[j] = out[j], out[i] })
	return out
}

func interleave(groups [][]string) []string {
	left := make([][]string, len(groups))
	for i, g := range groups {
		left[i] = append([]string(nil), g...)
	}
	out := make([]string, 0, 33)
	for {
		moved := false
		for i := range left {
			if len(left[i]) == 0 {
				continue
			}
			out = append(out, left[i][0])
			left[i] = left[i][1:]
			moved = true
		}
		if !moved {
			return out
		}
	}
}

func axisOf(id string) string {
	for name, spec := range Scales {
		for _, it := range spec.Items {
			if it.ID == id {
				return name
			}
		}
	}
	return ""
}
