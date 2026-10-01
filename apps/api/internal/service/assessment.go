package service

import (
	"crypto/rand"
	"encoding/binary"
	"encoding/json"
	"sync"
	"time"

	"ru-xi/api/internal/questionset"
	"ru-xi/api/internal/rules"
)

type Profile struct {
	Gender             string   `json:"gender"`
	AgeBand            string   `json:"age_band"`
	ExactAge           *int     `json:"exact_age,omitempty"`
	AvatarPresentation string   `json:"avatar_presentation,omitempty"`
	AvatarAge          string   `json:"avatar_age,omitempty"`
	Experience         string   `json:"experience,omitempty"`
	SceneExperience    []string `json:"scene_experience,omitempty"`
	ScareExperience    string   `json:"scare_experience,omitempty"`
	Nickname           string   `json:"nickname,omitempty"`
}

type AnswerPatch struct {
	ID    string          `json:"id"`
	State string          `json:"state"`
	Value json.RawMessage `json:"value"`
}

type storedAnswer struct {
	State        string  `json:"state"`
	Likert       *int    `json:"likert,omitempty"`
	Enum         *string `json:"enum,omitempty"`
	Status       string  `json:"status"`
	NeedsConfirm bool    `json:"needs_confirm"`
}

type Assessment struct {
	ID              string                  `json:"id"`
	UserID          string                  `json:"user_id"`
	IdempotencyKey  string                  `json:"idempotency_key,omitempty"`
	Profile         Profile                 `json:"profile"`
	QuestionVersion string                  `json:"question_version"`
	Seed            int64                   `json:"seed"`
	BaseOrder       []string                `json:"base_order"`
	Revision        int                     `json:"revision"`
	Status          string                  `json:"status"`
	Deferred        map[string]bool         `json:"deferred"`
	Answers         map[string]storedAnswer `json:"answers"`
	ReportID        string                  `json:"report_id,omitempty"`
	CreatedAt       time.Time               `json:"created_at"`
}

type BranchProgress struct {
	Branch   string `json:"branch"`
	Label    string `json:"label"`
	Required bool   `json:"required"`
	Deferred bool   `json:"deferred"`
	Answered int    `json:"answered"`
	Total    int    `json:"total"`
	Note     string `json:"note,omitempty"`
}

type Plan struct {
	Revision      int                         `json:"revision"`
	Status        string                      `json:"status"`
	BaseAnswered  int                         `json:"base_answered"`
	BaseTotal     int                         `json:"base_total"`
	Branches      []BranchProgress            `json:"branches"`
	Preface       string                      `json:"preface,omitempty"`
	Next          *questionset.PublicQuestion `json:"next"`
	ReadyToSubmit bool                        `json:"ready_to_submit"`
}

type Report struct {
	ID              string                     `json:"id"`
	AssessmentID    string                     `json:"assessment_id"`
	Status          string                     `json:"status"`
	Depth           string                     `json:"depth"`
	Scores          map[string]*float64        `json:"scores"`
	Letters         map[string]rules.Letter    `json:"letters"`
	FullType        *string                    `json:"full_type"`
	TypeName        *string                    `json:"type_name"`
	Courage         rules.CourageView          `json:"courage"`
	Story           map[string]rules.StoryAxis `json:"story"`
	Radar           []rules.RadarPoint         `json:"radar"`
	QuestionVersion string                     `json:"question_version"`
	RulesVersion    string                     `json:"rules_version"`
	CreatedAt       time.Time                  `json:"created_at"`
}

type Service struct {
	bank    *questionset.Bank
	mu      sync.Mutex
	items   map[string]*Assessment
	idem    map[string]string
	reports map[string]*Report
}

func New(bank *questionset.Bank) *Service {
	return &Service{
		bank:    bank,
		items:   map[string]*Assessment{},
		idem:    map[string]string{},
		reports: map[string]*Report{},
	}
}

func (s *Service) Prompts() map[string]string {
	return s.bank.Prompts
}

func (s *Service) QuestionSet() *questionset.Bank {
	return s.bank
}

func (s *Service) Create(userID, idempotencyKey string, profile Profile) (*Assessment, error) {
	if userID == "" {
		return nil, missing("用户")
	}
	if idempotencyKey == "" {
		return nil, missing("idempotency_key")
	}
	if err := validateProfile(profile); err != nil {
		return nil, err
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	idem := userID + "\x00" + idempotencyKey
	if prev, ok := s.idem[idem]; ok {
		existing := s.items[prev]
		if profileKey(existing.Profile) != profileKey(profile) {
			return nil, fail(409, "IDEMPOTENCY_CONFLICT", "同一个幂等键对应了不同的开场资料")
		}
		return existing, nil
	}
	seed := randomSeed()
	item := &Assessment{
		ID:              randomID(),
		UserID:          userID,
		IdempotencyKey:  idempotencyKey,
		Profile:         profile,
		QuestionVersion: s.bank.QuestionVersion,
		Seed:            seed,
		BaseOrder:       rules.BaseOrder(seed),
		Status:          "draft",
		Deferred:        map[string]bool{},
		Answers:         map[string]storedAnswer{},
		CreatedAt:       time.Now().UTC(),
	}
	s.items[item.ID] = item
	s.idem[idem] = item.ID
	return item, nil
}

func (s *Service) Get(userID, id string) (*Assessment, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.owned(userID, id)
}

func (s *Service) Plan(userID, id string) (*Plan, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	item, err := s.owned(userID, id)
	if err != nil {
		return nil, err
	}
	return s.plan(item), nil
}

func (s *Service) Patch(userID, id string, expected int, patches []AnswerPatch) (*Plan, error) {
	if len(patches) == 0 {
		return nil, missing("answers")
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	item, err := s.owned(userID, id)
	if err != nil {
		return nil, err
	}
	if item.Revision != expected {
		return nil, fail(409, "REVISION_CONFLICT", "答卷已更新，请刷新后再提交")
	}
	if item.ReportID != "" {
		return nil, fail(409, "RESULT_LOCKED", "这份结果已经生成，不能再改答案")
	}
	active := item.activeMap()
	plan := rules.BranchPlan(active)
	h005 := enumOf(item.Answers, "H005")
	for _, patch := range patches {
		if patch.ID == "" {
			return nil, missing("answers.id")
		}
		if patch.ID == "H005" && patch.State == "answered" {
			var enum string
			if json.Unmarshal(patch.Value, &enum) == nil {
				h005 = enum
			}
		}
		if patch.ID == "H005" && patch.State == "unknown" {
			h005 = ""
		}
	}
	parsed := map[string]rules.Value{}
	for _, patch := range patches {
		if _, ok := s.bank.Get(patch.ID); !ok {
			return nil, fail(400, "INVALID_ANSWER", "未知题号")
		}
		if patch.ID[0] == 'H' && !contains(plan, patch.ID) {
			return nil, fail(400, "INACTIVE_QUESTION", "这道补充题当前没有激活")
		}
		value, err := s.bank.Parse(patch.ID, patch.State, patch.Value, h005)
		if err != nil {
			return nil, wrapInvalid(err)
		}
		parsed[patch.ID] = value
	}
	working := cloneAnswers(item.Answers)
	oldH005 := enumOf(working, "H005")
	dependencyChanged := false
	for id := range parsed {
		if (id >= "B041" && id <= "B050") || (id >= "H001" && id <= "H004") {
			dependencyChanged = true
		}
	}
	for id, value := range parsed {
		working[id] = fromValue(value)
	}
	if _, touched := parsed["H005"]; touched && oldH005 != enumOf(working, "H005") {
		if _, also := parsed["H008"]; !also {
			delete(working, "H008")
		}
	}
	if rec, ok := working["H008"]; ok && rec.Status != "superseded" && rec.State == "answered" {
		parent := enumOf(working, "H005")
		child := ""
		if rec.Enum != nil {
			child = *rec.Enum
		}
		if !rules.LegalH008(parent, child) {
			return nil, fail(400, "INVALID_ANSWER", "坦奶子类和父类不匹配")
		}
	}
	if dependencyChanged {
		for _, id := range []string{"H005", "H006", "H007", "H008"} {
			rec, ok := working[id]
			_, replaced := parsed[id]
			if !ok || replaced {
				continue
			}
			rec.NeedsConfirm = true
			working[id] = rec
		}
	}
	item.Answers = working
	nextPlan := rules.BranchPlan(item.activeMap())
	for id, rec := range working {
		if id == "" || id[0] != 'H' {
			continue
		}
		inPlan := contains(nextPlan, id)
		updated := rec
		switch {
		case rec.Status != "superseded" && !inPlan:
			updated.Status = "superseded"
		case rec.Status == "superseded" && inPlan:
			updated.Status = "active"
			updated.NeedsConfirm = true
		default:
			continue
		}
		item.Answers[id] = updated
	}
	item.Revision++
	item.ReportID = ""
	if item.Status == "completed" || item.Status == "partial" {
		item.Status = "draft"
	}
	return s.plan(item), nil
}

func (s *Service) Defer(userID, id, branch string, expected int) (*Plan, error) {
	if branch == "C" {
		return nil, fail(400, "INVALID_ANSWER", "坦奶身份确认不能稍后跳过")
	}
	if branch != "S" && branch != "N" && branch != "T" && branch != "P" {
		return nil, fail(400, "INVALID_ANSWER", "未知分支")
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	item, err := s.owned(userID, id)
	if err != nil {
		return nil, err
	}
	if item.Revision != expected {
		return nil, fail(409, "REVISION_CONFLICT", "答卷已更新，请刷新后再提交")
	}
	if item.ReportID != "" {
		return nil, fail(409, "RESULT_LOCKED", "这份结果已经生成，不能再改答案")
	}
	found := false
	for _, qid := range rules.BranchPlan(item.activeMap()) {
		if rules.BranchOf(qid) == branch {
			found = true
			break
		}
	}
	if !found {
		return nil, fail(400, "INACTIVE_QUESTION", "这条补充线当前没有激活")
	}
	item.Deferred[branch] = true
	item.Revision++
	return s.plan(item), nil
}

func (s *Service) Submit(userID, id string, expected int, allowPartial bool) (*Report, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	item, err := s.owned(userID, id)
	if err != nil {
		return nil, err
	}
	if item.Revision != expected {
		return nil, fail(409, "REVISION_CONFLICT", "答卷已更新，请刷新后再提交")
	}
	if item.ReportID != "" {
		return s.reports[item.ReportID], nil
	}
	report := s.buildReport(item)
	if report.Status != "completed" && !allowPartial {
		return nil, fail(409, "INSUFFICIENT_DATA", "还有未完成的必要题目")
	}
	report.ID = randomID()
	report.CreatedAt = time.Now().UTC()
	s.reports[report.ID] = report
	item.ReportID = report.ID
	item.Status = report.Status
	return report, nil
}

func (s *Service) Report(userID, id string) (*Report, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	report, ok := s.reports[id]
	if !ok {
		return nil, fail(404, "NOT_FOUND", "报告不存在")
	}
	if _, err := s.owned(userID, report.AssessmentID); err != nil {
		return nil, err
	}
	return report, nil
}

func (s *Service) owned(userID, id string) (*Assessment, error) {
	item, ok := s.items[id]
	if !ok || item.UserID != userID {
		return nil, fail(404, "NOT_FOUND", "答卷不存在")
	}
	return item, nil
}

func (s *Service) plan(item *Assessment) *Plan {
	active := item.activeMap()
	baseAnswered := 0
	for _, id := range item.BaseOrder {
		if active.Has(id) {
			baseAnswered++
		}
	}
	branchPlan := rules.BranchPlan(active)
	view := &Plan{
		Revision:     item.Revision,
		Status:       item.Status,
		BaseAnswered: baseAnswered,
		BaseTotal:    60,
		Branches:     branchProgress(item, branchPlan),
	}
	next := nextQuestion(item, active, branchPlan)
	if next == "" {
		view.ReadyToSubmit = baseAnswered == 60
		return view
	}
	q, _ := s.bank.Get(next)
	public := s.bank.Public(q, enumOf(item.Answers, "H005"))
	view.Next = &public
	view.Preface = s.prefaceText(preface(item, next, branchPlan))
	return view
}

func (s *Service) prefaceText(key string) string {
	switch key {
	case "courage":
		return s.bank.Prompts["courage"]
	case "emotion":
		return s.bank.Prompts["emotion"]
	case "play":
		return s.bank.Prompts["play_prefix"]
	case "branch:C":
		return "基础反应还不能确定一个坦奶身份，需要再确认同一类惊吓情境。"
	case "branch:S":
		return "刺激或行动的选择需要再确认具体安排。"
	case "branch:N":
		return "叙事和接戏的节奏需要再确认。"
	case "branch:T":
		return "组队和陪同需要再确认这一次怎么配合。"
	case "branch:P":
		return "有一项偏好接近中间，补充两题只用于说明方向。"
	default:
		return ""
	}
}

func (s *Service) buildReport(item *Assessment) *Report {
	active := item.activeMap()
	scores := rules.Scores(active)
	scoreView := map[string]*float64{}
	for _, axis := range []string{"interaction", "focus", "route", "intensity", "movement", "immersion", "cooperation", "narrative", "timing", "story_emotion", "story_tears"} {
		if v, ok := scores[axis]; ok {
			copied := v
			scoreView[axis] = &copied
		} else {
			scoreView[axis] = nil
		}
	}
	letters := rules.Letters(active)
	var full *string
	var name *string
	if code, ok := rules.FullType(letters); ok {
		full = &code
		if label, ok := rules.TypeName(code); ok {
			name = &label
		}
	}
	courage := rules.CouragePublic(rules.ClassifyCourage(active), basisOf(item.Profile))
	status, depth := reportStatus(item, active)
	return &Report{
		AssessmentID:    item.ID,
		Status:          status,
		Depth:           depth,
		Scores:          scoreView,
		Letters:         letters,
		FullType:        full,
		TypeName:        name,
		Courage:         courage,
		Story:           rules.StoryResponse(active),
		Radar:           rules.Radar(scores),
		QuestionVersion: s.bank.QuestionVersion,
		RulesVersion:    "score-2.1",
	}
}

func reportStatus(item *Assessment, active rules.AnswerMap) (string, string) {
	baseDone := true
	for _, id := range rules.BaseIDs() {
		if !active.Has(id) {
			baseDone = false
			break
		}
	}
	pending := false
	deferredLeft := false
	for _, id := range rules.BranchPlan(active) {
		branch := rules.BranchOf(id)
		rec, ok := item.Answers[id]
		done := ok && rec.Status == "active" && !rec.NeedsConfirm
		if item.Deferred[branch] {
			if !done {
				deferredLeft = true
			}
			continue
		}
		if !done {
			pending = true
		}
	}
	courageOK := rules.ClassifyCourage(active).Status == "resolved"
	if !baseDone || pending || !courageOK {
		return "partial", "partial"
	}
	if deferredLeft {
		return "completed", "base_with_deferred"
	}
	return "completed", "full"
}

func nextQuestion(item *Assessment, active rules.AnswerMap, plan []string) string {
	for _, id := range item.BaseOrder {
		if !active.Has(id) {
			return id
		}
	}
	for _, id := range plan {
		if item.Deferred[rules.BranchOf(id)] {
			continue
		}
		rec, ok := item.Answers[id]
		if !ok || rec.Status != "active" || rec.NeedsConfirm {
			return id
		}
	}
	return ""
}

func branchProgress(item *Assessment, plan []string) []BranchProgress {
	order := []string{"C", "S", "N", "T", "P"}
	labels := map[string]string{"C": "坦奶情境", "S": "惊吓与行动", "N": "叙事与接戏", "T": "组队与分工", "P": "临界偏好"}
	grouped := map[string][]string{}
	for _, id := range plan {
		branch := rules.BranchOf(id)
		grouped[branch] = append(grouped[branch], id)
	}
	out := []BranchProgress{}
	for _, branch := range order {
		ids := grouped[branch]
		if len(ids) == 0 {
			continue
		}
		answered := 0
		for _, id := range ids {
			rec, ok := item.Answers[id]
			if ok && rec.Status == "active" && !rec.NeedsConfirm {
				answered++
			}
		}
		note := ""
		if len(ids) > 4 && answered >= 4 {
			note = "再确认4个安排"
		}
		out = append(out, BranchProgress{
			Branch: branch, Label: labels[branch], Required: branch == "C",
			Deferred: item.Deferred[branch], Answered: answered, Total: len(ids), Note: note,
		})
	}
	return out
}

func cloneAnswers(in map[string]storedAnswer) map[string]storedAnswer {
	out := make(map[string]storedAnswer, len(in))
	for id, rec := range in {
		out[id] = rec
	}
	return out
}

func preface(item *Assessment, next string, plan []string) string {
	if next >= "B041" && next <= "B050" {
		for _, id := range item.BaseOrder {
			if id >= "B041" && id <= "B050" {
				if id == next {
					return "courage"
				}
				break
			}
		}
	}
	if next >= "E001" && next <= "E004" {
		for _, id := range item.BaseOrder {
			if id >= "E001" && id <= "E004" {
				if id == next {
					return "emotion"
				}
				break
			}
		}
	}
	if next >= "B051" && next <= "B055" {
		return "play"
	}
	branch := rules.BranchOf(next)
	if branch == "" {
		return ""
	}
	for _, id := range plan {
		if rules.BranchOf(id) != branch || item.Deferred[branch] {
			continue
		}
		rec, ok := item.Answers[id]
		done := ok && rec.Status == "active" && !rec.NeedsConfirm
		if !done {
			if id == next {
				return "branch:" + branch
			}
			return ""
		}
	}
	return ""
}

func (item *Assessment) activeMap() rules.AnswerMap {
	out := rules.AnswerMap{}
	for id, rec := range item.Answers {
		if rec.Status == "superseded" {
			continue
		}
		switch rec.State {
		case "unknown":
			out.SetUnknown(id)
		case "answered":
			if rec.Likert != nil {
				out.SetLikert(id, *rec.Likert)
			}
			if rec.Enum != nil {
				out.SetEnum(id, *rec.Enum)
			}
		}
	}
	return out
}

func fromValue(v rules.Value) storedAnswer {
	rec := storedAnswer{State: v.Kind, Status: "active"}
	switch v.Kind {
	case "likert":
		n := v.Likert
		rec.State = "answered"
		rec.Likert = &n
	case "enum":
		enum := v.Enum
		rec.State = "answered"
		rec.Enum = &enum
	case "unknown":
		rec.State = "unknown"
	}
	return rec
}

func enumOf(answers map[string]storedAnswer, id string) string {
	rec, ok := answers[id]
	if !ok || rec.Status == "superseded" || rec.Enum == nil {
		return ""
	}
	return *rec.Enum
}

func contains(ids []string, id string) bool {
	for _, item := range ids {
		if item == id {
			return true
		}
	}
	return false
}

func basisOf(p Profile) string {
	switch p.ScareExperience {
	case "imagined":
		return "imagined"
	case "experienced":
		return "experienced"
	default:
		return "unknown"
	}
}

func validateProfile(p Profile) error {
	switch p.Gender {
	case "male", "female", "undisclosed":
	default:
		return fail(400, "MISSING_FIELD", "请选择性别或选择不便透露")
	}
	switch p.AgeBand {
	case "", "child", "youth", "mature":
	default:
		return fail(400, "MISSING_FIELD", "请选择年龄档")
	}
	if p.ExactAge != nil && (*p.ExactAge < 0 || *p.ExactAge > 120) {
		return fail(400, "INVALID_ANSWER", "精确年龄需要在0到120之间")
	}
	if p.ExactAge != nil && ageConflicts(p.AgeBand, *p.ExactAge) {
		return fail(409, "AGE_BAND_CONFLICT", "精确年龄和年龄档不一致，请本人确认后再继续")
	}
	if p.Nickname != "" {
		n := len([]rune(p.Nickname))
		if n < 1 || n > 12 {
			return fail(400, "INVALID_ANSWER", "昵称需要在1到12个字之间")
		}
	}
	if p.Experience != "" && p.Experience != "none" && p.Experience != "1_5" && p.Experience != "6_20" && p.Experience != "21_plus" {
		return fail(400, "INVALID_ANSWER", "经历选项不正确")
	}
	if p.ScareExperience != "" && p.ScareExperience != "experienced" && p.ScareExperience != "imagined" && p.ScareExperience != "unknown" {
		return fail(400, "INVALID_ANSWER", "惊吓经历选项不正确")
	}
	none := false
	for _, scene := range p.SceneExperience {
		if scene == "none" {
			none = true
		} else if scene != "immersive" && scene != "chase" && scene != "other" {
			return fail(400, "INVALID_ANSWER", "场景经历选项不正确")
		}
	}
	if none && len(p.SceneExperience) > 1 {
		return fail(400, "INVALID_ANSWER", "没有相关场景经历时，不能同时选择其他场景")
	}
	return nil
}

func ageConflicts(band string, age int) bool {
	switch band {
	case "child":
		return age >= 18
	case "youth":
		return age < 18 || age >= 35
	case "mature":
		return age < 35
	default:
		return false
	}
}

func profileKey(p Profile) string {
	raw, _ := json.Marshal(p)
	return string(raw)
}

func randomID() string {
	var b [8]byte
	_, _ = rand.Read(b[:])
	const hexdigits = "0123456789abcdef"
	out := make([]byte, 16)
	for i, v := range b {
		out[i*2] = hexdigits[v>>4]
		out[i*2+1] = hexdigits[v&0x0f]
	}
	return string(out)
}

func randomSeed() int64 {
	var b [8]byte
	_, _ = rand.Read(b[:])
	return int64(binary.LittleEndian.Uint64(b[:]) & 0x7fffffffffffffff)
}
