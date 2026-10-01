package questionset

import (
	"testing"

	"ru-xi/api/internal/rules"
)

func TestBankMatchesSpec(t *testing.T) {
	bank, err := Load()
	if err != nil {
		t.Fatal(err)
	}
	if len(bank.byID) != 100 {
		t.Fatalf("indexed %d", len(bank.byID))
	}
	ids := map[string]bool{}
	for _, q := range bank.Questions {
		ids[q.ID] = true
	}
	for _, id := range append(rules.BaseIDs(), rules.HiddenIDs()...) {
		if !ids[id] {
			t.Fatalf("V001 missing %s", id)
		}
	}
	for _, spec := range rules.Scales {
		for _, it := range spec.Items {
			q, ok := bank.Get(it.ID)
			if !ok {
				t.Fatalf("missing %s", it.ID)
			}
			if q.Reverse != it.Reverse {
				t.Fatalf("%s reverse=%v want %v", it.ID, q.Reverse, it.Reverse)
			}
		}
	}
	q, _ := bank.Get("B001")
	if q.Text != "NPC向全队开放提问时，我通常想主动接话。" {
		t.Fatalf("stem changed: %s", q.Text)
	}
	h008, _ := bank.Get("H008")
	if len(h008.DependsOn) != 1 || h008.DependsOn[0] != "H005" {
		t.Fatalf("H008 depends %#v", h008.DependsOn)
	}
	parent := bank.H008ByParent["independent"]
	if len(parent) != 3 {
		t.Fatalf("H008 parent options %#v", parent)
	}
}

func TestParseRejectsIllegalH008(t *testing.T) {
	bank, err := Load()
	if err != nil {
		t.Fatal(err)
	}
	if _, err := bank.Parse("H008", "answered", []byte(`"S"`), "independent"); err == nil {
		t.Fatal("V021: illegal child should be rejected")
	}
	got, err := bank.Parse("H008", "answered", []byte(`"M"`), "independent")
	if err != nil || got.Enum != "M" {
		t.Fatal(err, got)
	}
	likert, err := bank.Parse("B001", "answered", []byte(`3`), "")
	if err != nil || likert.Likert != 3 {
		t.Fatal(err, likert)
	}
	unknown, err := bank.Parse("B001", "unknown", []byte(`null`), "")
	if err != nil || unknown.Kind != "unknown" {
		t.Fatal(err)
	}
}
