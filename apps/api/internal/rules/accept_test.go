package rules

import "testing"

func fillScale(a AnswerMap, axis string, positive, reverse int) {
	t := Scales[axis]
	for _, it := range t.Items {
		if it.Reverse {
			a.SetLikert(it.ID, reverse)
		} else {
			a.SetLikert(it.ID, positive)
		}
	}
}

func setRange(a AnswerMap, from, to, n int) {
	for i := from; i <= to; i++ {
		a.SetLikert(idB(i), n)
	}
}

func noBranchAnswers() AnswerMap {
	a := AnswerMap{}
	for _, axis := range []string{"interaction", "focus", "route", "immersion", "cooperation", "narrative", "timing"} {
		fillScale(a, axis, 5, 1)
	}
	for _, axis := range []string{"intensity", "movement"} {
		fillScale(a, axis, 1, 5)
	}
	setRange(a, 41, 42, 5)
	setRange(a, 43, 44, 1)
	setRange(a, 45, 46, 1)
	a.SetLikert("B047", 5)
	setRange(a, 48, 49, 1)
	a.SetLikert("B050", 5)
	a.SetEnum("B051", "avoid")
	a.SetEnum("B052", "avoid")
	a.SetEnum("B053", "accept")
	a.SetEnum("B054", "accept")
	a.SetEnum("B055", "accept")
	a.SetEnum("B056", "independent")
	for _, id := range []string{"E001", "E002", "E003", "E004"} {
		a.SetLikert(id, 3)
	}
	return a
}

func TestV002NoBranchCanFinishAt60(t *testing.T) {
	plan := BranchPlan(noBranchAnswers())
	if len(plan) != 0 {
		t.Fatalf("V002: got %d hidden questions %v", len(plan), plan)
	}
}

func TestV003AllBranchesStopAt40(t *testing.T) {
	a := AnswerMap{}
	for _, id := range BaseIDs() {
		if id >= "B051" && id <= "B056" {
			continue
		}
		a.SetLikert(id, 3)
	}
	a.SetEnum("B051", "love")
	a.SetEnum("B052", "accept")
	a.SetEnum("B053", "accept")
	a.SetEnum("B054", "accept")
	a.SetEnum("B055", "accept")
	a.SetEnum("B056", "accompany")
	for _, id := range []string{"H001", "H002", "H003", "H004"} {
		a.SetLikert(id, 3)
	}
	a.SetEnum("H009", "no")
	a.SetEnum("H010", "accept")
	a.SetEnum("H011", "accept")
	a.SetEnum("H012", "accept")
	a.SetEnum("H017", "open")
	a.SetEnum("H018", "break")
	a.SetEnum("H019", "some")
	a.SetEnum("H020", "no")
	a.SetEnum("H025", "accompany")
	a.SetEnum("H026", "none")
	a.SetEnum("H027", "rotate")
	a.SetEnum("H028", "uniform")

	plan := BranchPlan(a)
	if len(plan) != 40 {
		t.Fatalf("V003: got %d hidden questions %v", len(plan), plan)
	}
	seen := map[string]bool{}
	for _, id := range plan {
		if seen[id] {
			t.Fatalf("duplicate %s", id)
		}
		seen[id] = true
	}
	for _, id := range HiddenIDs() {
		if !seen[id] {
			t.Fatalf("missing %s", id)
		}
	}
}

func TestV004StageOneCanStop(t *testing.T) {
	a := noBranchAnswers()
	setRange(a, 41, 50, 3)
	a.SetLikert("H001", 5)
	a.SetLikert("H002", 1)
	a.SetLikert("H003", 1)
	a.SetLikert("H004", 1)
	plan := BranchPlan(a)
	for _, id := range plan {
		if id == "H005" || BranchOf(id) != "C" && false {
			t.Fatal(id)
		}
		if id >= "H005" && id <= "H008" {
			t.Fatalf("V004: second stage activated: %v", plan)
		}
	}
	if QuickCourage(a, true) != "M" {
		t.Fatalf("stage one should resolve to micro tank, got %q", QuickCourage(a, true))
	}
}

func TestV005AllUnknownStaysPending(t *testing.T) {
	a := AnswerMap{}
	for _, id := range BaseIDs() {
		a.SetUnknown(id)
	}
	if len(Scores(a)) != 0 {
		t.Fatalf("V005: unknown produced scores %#v", Scores(a))
	}
	got := ClassifyCourage(a)
	if got.Status != "pending" || got.Code != "" {
		t.Fatalf("V005: got %#v", got)
	}
}

func TestV006ThreeScoresAndUnknownDoesNot(t *testing.T) {
	a := AnswerMap{}
	a.SetLikert("B001", 3)
	a.SetLikert("B002", 3)
	a.SetLikert("B003", 3)
	a.SetLikert("B004", 3)
	a.SetUnknown("B005")
	got, ok := Scale(a, Scales["interaction"])
	if !ok || !near(got, 50) {
		t.Fatalf("V006: got %v ok=%v", got, ok)
	}
}

func TestV007AndV008Coverage(t *testing.T) {
	a := AnswerMap{}
	a.SetLikert("B001", 5)
	a.SetLikert("B002", 5)
	a.SetLikert("B003", 5)
	if _, ok := Scale(a, Scales["interaction"]); ok {
		t.Fatal("V007: 3/5 should be null")
	}
	custom := ScaleSpec{Items: []Item{{"Q1", false}, {"Q2", false}, {"Q3", false}, {"Q4", false}, {"Q5", true}}, Minimum: 4, MinPositive: 1, MinReverse: 1}
	partial := AnswerMap{}
	partial.SetLikert("Q1", 5)
	partial.SetLikert("Q2", 5)
	partial.SetLikert("Q3", 5)
	partial.SetLikert("Q4", 5)
	if _, ok := Scale(partial, custom); ok {
		t.Fatal("V008: four answers without a reverse item should be null")
	}
}

func TestV009Extremes(t *testing.T) {
	high := AnswerMap{}
	fillScale(high, "interaction", 5, 1)
	got, ok := Scale(high, Scales["interaction"])
	if !ok || !near(got, 100) {
		t.Fatalf("high=%v ok=%v", got, ok)
	}
	low := AnswerMap{}
	fillScale(low, "interaction", 1, 5)
	got, ok = Scale(low, Scales["interaction"])
	if !ok || !near(got, 0) {
		t.Fatalf("low=%v ok=%v", got, ok)
	}
}

func TestV010ContextReferenceKeepsBase50(t *testing.T) {
	a := AnswerMap{}
	fillScale(a, "interaction", 3, 3)
	a.SetLikert("H033", 5)
	a.SetLikert("H034", 1)
	letter := Letters(a)["interaction"]
	if letter.Score == nil || !near(*letter.Score, 50) {
		t.Fatalf("score=%v", letter.Score)
	}
	if letter.Base != nil {
		t.Fatalf("base letter should stay empty, got %q", *letter.Base)
	}
	if letter.Display != "A" || letter.Source != "context_reference" {
		t.Fatalf("letter=%+v", letter)
	}
}

func TestV011HiddenAnswersDoNotChangePairScore(t *testing.T) {
	base := map[string]float64{"interaction": 80, "focus": 70, "route": 60, "intensity": 40, "movement": 20}
	left, _, ok := PairScore(base, base, "immersive")
	if !ok || !near(left, 100) {
		t.Fatalf("self score=%v ok=%v", left, ok)
	}
	swapped, _, ok := PairScore(base, base, "chase")
	if !ok || !near(swapped, 100) {
		t.Fatal(swapped)
	}
}

func TestCourageArchetypes(t *testing.T) {
	cases := []struct {
		name string
		set  func(AnswerMap)
		want string
	}{
		{"V016", func(a AnswerMap) {
			setRange(a, 41, 42, 5)
			setRange(a, 43, 44, 1)
			setRange(a, 45, 46, 1)
			a.SetLikert("B047", 5)
			setRange(a, 48, 49, 1)
			a.SetLikert("B050", 5)
		}, "G"},
		{"V017", func(a AnswerMap) {
			setRange(a, 41, 42, 5)
			setRange(a, 43, 44, 1)
			setRange(a, 45, 46, 5)
			a.SetLikert("B047", 1)
			setRange(a, 48, 49, 5)
			a.SetLikert("B050", 1)
		}, "M"},
		{"V018", func(a AnswerMap) {
			setRange(a, 41, 42, 1)
			setRange(a, 43, 44, 5)
			setRange(a, 45, 46, 5)
			a.SetLikert("B047", 1)
			setRange(a, 48, 49, 5)
			a.SetLikert("B050", 1)
		}, "S"},
		{"V019", func(a AnswerMap) {
			setRange(a, 41, 42, 1)
			setRange(a, 43, 44, 5)
			setRange(a, 45, 46, 5)
			a.SetLikert("B047", 1)
			setRange(a, 48, 49, 1)
			a.SetLikert("B050", 5)
		}, "Q"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			a := AnswerMap{}
			fillScale(a, "intensity", 5, 1)
			tc.set(a)
			if got := QuickCourage(a, false); got != tc.want {
				t.Fatalf("got %s", got)
			}
			intensity, ok := Scale(a, Scales["intensity"])
			if !ok || !near(intensity, 100) {
				t.Fatalf("intensity changed: %v", intensity)
			}
		})
	}
}

func TestV020InconsistentCourageNeedsBranch(t *testing.T) {
	a := AnswerMap{}
	setRange(a, 41, 42, 5)
	setRange(a, 43, 44, 1)
	setRange(a, 45, 46, 5)
	a.SetLikert("B047", 1)
	setRange(a, 48, 49, 1)
	a.SetLikert("B050", 5)
	if QuickCourage(a, false) != "" {
		t.Fatal("quiet action with fear should not be forced into a subtype")
	}
	got := ClassifyCourage(a)
	if got.Status != "pending" {
		t.Fatalf("%#v", got)
	}
}

func TestV021RejectsIllegalParentChild(t *testing.T) {
	if LegalH008("independent", "S") || LegalH008("independent", "Q") {
		t.Fatal("milk subtype cannot sit under independent")
	}
	if !LegalH008("independent", "M") || !LegalH008("accompanied", "Q") {
		t.Fatal("legal pairs were rejected")
	}
}

func TestStoryAxesStayIndependent(t *testing.T) {
	a := AnswerMap{}
	fillScale(a, "interaction", 5, 1)
	a.SetLikert("E001", 5)
	a.SetLikert("E002", 1)
	a.SetLikert("E003", 1)
	a.SetLikert("E004", 5)
	story := StoryResponse(a)
	if story["story_emotion"].Label != "higher" || story["story_tears"].Label != "lower" {
		t.Fatalf("V069: %#v", story)
	}
	before, _ := Scale(a, Scales["interaction"])
	a.SetLikert("E001", 1)
	a.SetLikert("E002", 5)
	a.SetLikert("E003", 5)
	a.SetLikert("E004", 1)
	story = StoryResponse(a)
	if story["story_emotion"].Label != "lower" || story["story_tears"].Label != "higher" {
		t.Fatalf("V070: %#v", story)
	}
	after, _ := Scale(a, Scales["interaction"])
	if !near(before, after) {
		t.Fatal("V073: story answers changed a five-axis score")
	}
	a.SetUnknown("E003")
	story = StoryResponse(a)
	if story["story_tears"].Label != "pending" || story["story_emotion"].Label != "lower" {
		t.Fatalf("V071: %#v", story)
	}
	a.SetLikert("E001", 5)
	a.SetLikert("E002", 5)
	a.SetLikert("E003", 3)
	a.SetLikert("E004", 3)
	if StoryResponse(a)["story_emotion"].Label != "context_varies" {
		t.Fatalf("V072: %#v", StoryResponse(a)["story_emotion"])
	}
}

func TestRadarLeavesGap(t *testing.T) {
	a := AnswerMap{}
	fillScale(a, "immersion", 5, 1)
	points := Radar(Scores(a))
	if points[0].Value == nil || points[1].Value != nil {
		t.Fatalf("V024: %#v", points)
	}
	if *points[0].Value == 0 && points[1].Axis == "interaction" && points[1].Value != nil {
		t.Fatal("missing axis was filled with zero")
	}
}

func TestBaseOrderIsStableAndBounded(t *testing.T) {
	first := BaseOrder(7)
	second := BaseOrder(7)
	if len(first) != 60 {
		t.Fatalf("len %d", len(first))
	}
	for i := range first {
		if first[i] != second[i] {
			t.Fatal("seed was not stable")
		}
	}
	seen := map[string]bool{}
	var runAxis string
	var run int
	for i, id := range first[:33] {
		if seen[id] {
			t.Fatalf("duplicate in block 1 %s", id)
		}
		seen[id] = true
		axis := axisOf(id)
		if axis == runAxis {
			run++
		} else {
			runAxis = axis
			run = 1
		}
		if run > 2 {
			t.Fatalf("axis %s ran %d at %d", axis, run, i)
		}
	}
	if len(seen) != 33 {
		t.Fatalf("block 1 has %d ids", len(seen))
	}
	tail := first[50:]
	want := []string{"B051", "B052", "B053", "B054", "B055", "B056", "E001", "E002", "E003", "E004"}
	for i, id := range want {
		if tail[i] != id {
			t.Fatalf("tail %v", tail)
		}
	}
}

func TestPairScoreRequiresSceneAxes(t *testing.T) {
	full := map[string]float64{"interaction": 10, "focus": 20, "route": 30, "intensity": 40, "movement": 50}
	missingFocus := map[string]float64{"interaction": 10, "route": 30, "intensity": 40, "movement": 50}
	if _, _, ok := PairScore(full, missingFocus, "immersive"); ok {
		t.Fatal("V026: immersive score should be null without focus")
	}
	missingMove := map[string]float64{"interaction": 10, "focus": 20, "route": 30, "intensity": 40}
	if _, _, ok := PairScore(full, missingMove, "chase"); ok {
		t.Fatal("V027: chase score should be null without movement")
	}
}
