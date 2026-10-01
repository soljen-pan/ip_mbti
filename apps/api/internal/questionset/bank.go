package questionset

import (
	_ "embed"
	"encoding/json"
	"fmt"

	"ru-xi/api/internal/rules"
)

//go:embed question_set.json
var raw []byte

type Option struct {
	Value any    `json:"value"`
	Label string `json:"label"`
}

type Question struct {
	ID         string   `json:"id"`
	Text       string   `json:"text"`
	Input      string   `json:"input"`
	OptionSet  string   `json:"option_set"`
	Reverse    bool     `json:"reverse"`
	Scale      string   `json:"scale,omitempty"`
	Activation string   `json:"activation"`
	Module     string   `json:"module"`
	Branch     string   `json:"branch,omitempty"`
	DependsOn  []string `json:"depends_on,omitempty"`
}

type PublicQuestion struct {
	ID        string   `json:"id"`
	Text      string   `json:"text"`
	Input     string   `json:"input"`
	Module    string   `json:"module"`
	Branch    string   `json:"branch,omitempty"`
	Options   []Option `json:"options"`
	DependsOn []string `json:"depends_on,omitempty"`
}

type Bank struct {
	QuestionVersion string              `json:"question_version"`
	ScoreVersion    string              `json:"score_version"`
	BranchVersion   string              `json:"branch_version"`
	CopyVersion     string              `json:"copy_version"`
	Prompts         map[string]string   `json:"prompts"`
	H008ByParent    map[string][]Option `json:"h008_by_parent"`
	OptionSets      map[string][]Option `json:"option_sets"`
	Questions       []Question          `json:"questions"`
	byID            map[string]Question
}

func Load() (*Bank, error) {
	var bank Bank
	if err := json.Unmarshal(raw, &bank); err != nil {
		return nil, err
	}
	bank.byID = make(map[string]Question, len(bank.Questions))
	for _, q := range bank.Questions {
		if _, ok := bank.byID[q.ID]; ok {
			return nil, fmt.Errorf("duplicate question %s", q.ID)
		}
		bank.byID[q.ID] = q
	}
	if len(bank.Questions) != 100 {
		return nil, fmt.Errorf("question count %d", len(bank.Questions))
	}
	return &bank, nil
}

func (b *Bank) Get(id string) (Question, bool) {
	q, ok := b.byID[id]
	return q, ok
}

func (b *Bank) Public(q Question, h005 string) PublicQuestion {
	return PublicQuestion{
		ID: q.ID, Text: q.Text, Input: q.Input, Module: q.Module, Branch: q.Branch,
		Options: b.optionsFor(q, h005), DependsOn: q.DependsOn,
	}
}

func (b *Bank) optionsFor(q Question, h005 string) []Option {
	if q.ID == "H008" {
		if opts, ok := b.H008ByParent[h005]; ok {
			return opts
		}
		return []Option{{Value: "unknown", Label: "无法判断"}}
	}
	opts := b.OptionSets[q.OptionSet]
	out := make([]Option, len(opts))
	copy(out, opts)
	return out
}

func (b *Bank) Parse(id, state string, value json.RawMessage, h005 string) (rules.Value, error) {
	q, ok := b.Get(id)
	if !ok {
		return rules.Value{}, fmt.Errorf("unknown question")
	}
	if state == "unknown" {
		if !isNull(value) {
			return rules.Value{}, fmt.Errorf("unknown value must be null")
		}
		return rules.Value{Kind: "unknown"}, nil
	}
	if state != "answered" {
		return rules.Value{}, fmt.Errorf("state must be answered or unknown")
	}
	switch q.Input {
	case "likert":
		var n float64
		if err := json.Unmarshal(value, &n); err != nil || n != float64(int(n)) || n < 1 || n > 5 {
			return rules.Value{}, fmt.Errorf("likert out of range")
		}
		return rules.Value{Kind: "likert", Likert: int(n)}, nil
	case "accept", "one":
		var enum string
		if err := json.Unmarshal(value, &enum); err != nil || enum == "" || enum == "unknown" {
			return rules.Value{}, fmt.Errorf("option required")
		}
		allowed := map[string]bool{}
		for _, opt := range b.optionsFor(q, h005) {
			if s, ok := opt.Value.(string); ok {
				allowed[s] = true
			}
		}
		if !allowed[enum] {
			return rules.Value{}, fmt.Errorf("option not allowed")
		}
		return rules.Value{Kind: "enum", Enum: enum}, nil
	default:
		return rules.Value{}, fmt.Errorf("unsupported input")
	}
}

func isNull(raw json.RawMessage) bool {
	return len(raw) == 0 || string(raw) == "null"
}
