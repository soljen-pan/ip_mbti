package service

import (
	"encoding/json"
	"testing"

	"ru-xi/api/internal/questionset"
	"ru-xi/api/internal/rules"
)

func testService(t *testing.T) *Service {
	t.Helper()
	bank, err := questionset.Load()
	if err != nil {
		t.Fatal(err)
	}
	return New(bank)
}

func profile() Profile {
	return Profile{Gender: "undisclosed", AgeBand: "youth", AvatarPresentation: "female", ScareExperience: "imagined"}
}

func likert(id string, n int) AnswerPatch {
	return AnswerPatch{ID: id, State: "answered", Value: json.RawMessage([]byte(itoa(n)))}
}

func enum(id, value string) AnswerPatch {
	raw, _ := json.Marshal(value)
	return AnswerPatch{ID: id, State: "answered", Value: raw}
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

func fill(patches *[]AnswerPatch, axis string, positive, reverse int) {
	spec := rules.Scales[axis]
	for _, it := range spec.Items {
		n := positive
		if it.Reverse {
			n = reverse
		}
		*patches = append(*patches, likert(it.ID, n))
	}
}

func TestCreateAndRejectInactiveHidden(t *testing.T) {
	svc := testService(t)
	item, err := svc.Create("u1", "k1", profile())
	if err != nil {
		t.Fatal(err)
	}
	again, err := svc.Create("u1", "k1", profile())
	if err != nil || again.ID != item.ID {
		t.Fatal(err, again)
	}
	if _, err := svc.Create("u1", "k1", Profile{Gender: "male", AgeBand: "youth"}); err == nil || asCode(err).Code != "IDEMPOTENCY_CONFLICT" {
		t.Fatal(err)
	}
	_, err = svc.Patch("u1", item.ID, 0, []AnswerPatch{likert("H001", 3)})
	if err == nil || asCode(err).Code != "INACTIVE_QUESTION" {
		t.Fatalf("V014: %v", err)
	}
	if _, err := svc.Patch("u1", item.ID, 3, []AnswerPatch{likert("B001", 4)}); err == nil || asCode(err).Code != "REVISION_CONFLICT" {
		t.Fatal(err)
	}
}

func TestNoBranchReport(t *testing.T) {
	svc := testService(t)
	item, err := svc.Create("u1", "report", profile())
	if err != nil {
		t.Fatal(err)
	}
	var patches []AnswerPatch
	for _, axis := range []string{"interaction", "focus", "route", "immersion", "cooperation", "narrative", "timing"} {
		fill(&patches, axis, 5, 1)
	}
	for _, axis := range []string{"intensity", "movement"} {
		fill(&patches, axis, 1, 5)
	}
	patches = append(patches,
		likert("B041", 5), likert("B042", 5), likert("B043", 1), likert("B044", 1),
		likert("B045", 1), likert("B046", 1), likert("B047", 5),
		likert("B048", 1), likert("B049", 1), likert("B050", 5),
		enum("B051", "avoid"), enum("B052", "avoid"), enum("B053", "accept"),
		enum("B054", "accept"), enum("B055", "accept"), enum("B056", "independent"),
	)
	fill(&patches, "story_emotion", 3, 3)
	fill(&patches, "story_tears", 3, 3)
	plan, err := svc.Patch("u1", item.ID, 0, patches)
	if err != nil {
		t.Fatal(err)
	}
	if !plan.ReadyToSubmit || plan.BaseAnswered != 60 || plan.Next != nil {
		t.Fatalf("V002 plan %+v", plan)
	}
	if _, err := svc.Submit("u1", item.ID, plan.Revision, false); err != nil {
		t.Fatal(err)
	}
	got, err := svc.Report("u1", mustReportID(t, svc, item.ID))
	if err != nil {
		t.Fatal(err)
	}
	if got.Status != "completed" || got.Depth != "full" {
		t.Fatalf("status %s %s", got.Status, got.Depth)
	}
	if got.Courage.Code != "T-G" || got.Courage.Basis != "imagined" {
		t.Fatalf("courage %+v", got.Courage)
	}
	if got.FullType == nil || *got.FullType != "ADLC-R" || got.TypeName == nil || *got.TypeName != "入戏旅人·缓行型" {
		t.Fatalf("type %v %v", got.FullType, got.TypeName)
	}
	if _, err := svc.Patch("u1", item.ID, plan.Revision, []AnswerPatch{likert("B001", 1)}); err == nil || asCode(err).Code != "RESULT_LOCKED" {
		t.Fatalf("finished result was changed: %v", err)
	}
	if again := mustReportID(t, svc, item.ID); again != got.ID {
		t.Fatalf("report id changed %s -> %s", got.ID, again)
	}
}

func TestIllegalH008DoesNotStick(t *testing.T) {
	svc := testService(t)
	item, err := svc.Create("u1", "h008", profile())
	if err != nil {
		t.Fatal(err)
	}
	var patches []AnswerPatch
	for _, axis := range rules.FiveAxes {
		fill(&patches, axis, 3, 3)
	}
	for _, axis := range []string{"immersion", "cooperation", "narrative", "timing", "story_emotion", "story_tears"} {
		fill(&patches, axis, 3, 3)
	}
	for n := 41; n <= 50; n++ {
		patches = append(patches, likert("B"+pad(n), 3))
	}
	patches = append(patches,
		enum("B051", "avoid"), enum("B052", "avoid"), enum("B053", "accept"),
		enum("B054", "accept"), enum("B055", "accept"), enum("B056", "independent"),
	)
	plan, err := svc.Patch("u1", item.ID, 0, patches)
	if err != nil {
		t.Fatal(err)
	}
	plan, err = svc.Patch("u1", item.ID, plan.Revision, []AnswerPatch{
		likert("H001", 3), likert("H002", 3), likert("H003", 3), likert("H004", 3),
	})
	if err != nil {
		t.Fatal(err)
	}
	rev := plan.Revision
	_, err = svc.Patch("u1", item.ID, rev, []AnswerPatch{enum("H005", "independent"), enum("H008", "S")})
	if err == nil || asCode(err).Code != "INVALID_ANSWER" {
		t.Fatalf("V021 %v", err)
	}
	current, err := svc.Get("u1", item.ID)
	if err != nil || current.Revision != rev {
		t.Fatalf("illegal answer stuck: rev %d err %v", current.Revision, err)
	}
	plan, err = svc.Patch("u1", item.ID, rev, []AnswerPatch{enum("H005", "independent"), enum("H008", "M")})
	if err != nil {
		t.Fatal(err)
	}
	plan, err = svc.Patch("u1", item.ID, plan.Revision, []AnswerPatch{enum("H005", "accompanied")})
	if err != nil {
		t.Fatal(err)
	}
	current, _ = svc.Get("u1", item.ID)
	if _, ok := current.Answers["H008"]; ok {
		t.Fatal("V013: old H008 remained after parent change")
	}
}

func pad(n int) string {
	if n < 10 {
		return "00" + itoa(n)
	}
	return "0" + itoa(n)
}

func mustReportID(t *testing.T, svc *Service, assessmentID string) string {
	t.Helper()
	item, err := svc.Get("u1", assessmentID)
	if err != nil || item.ReportID == "" {
		t.Fatal(err, item)
	}
	return item.ReportID
}
