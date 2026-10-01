package httpapi

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"ru-xi/api/internal/questionset"
	"ru-xi/api/internal/service"
)

type Server struct {
	svc *service.Service
}

func New(svc *service.Service) *Server {
	return &Server{svc: svc}
}

func (s *Server) Router() *gin.Engine {
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Recovery(), cors)
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})
	v2 := r.Group("/v2")
	v2.GET("/question-sets/current", s.questionSet)
	v2.POST("/assessments", s.create)
	v2.GET("/assessments/:id", s.get)
	v2.GET("/assessments/:id/plan", s.plan)
	v2.PATCH("/assessments/:id/answers", s.patch)
	v2.POST("/assessments/:id/defer", s.deferBranch)
	v2.POST("/assessments/:id/submit", s.submit)
	v2.GET("/reports/:id", s.report)
	return r
}

func cors(c *gin.Context) {
	c.Header("Access-Control-Allow-Origin", "*")
	c.Header("Access-Control-Allow-Headers", "Content-Type, X-User-Id")
	c.Header("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS")
	if c.Request.Method == http.MethodOptions {
		c.Status(http.StatusNoContent)
		c.Abort()
		return
	}
	c.Next()
}

func (s *Server) questionSet(c *gin.Context) {
	bank := s.svc.QuestionSet()
	questions := make([]questionset.PublicQuestion, 0, len(bank.Questions))
	for _, q := range bank.Questions {
		questions = append(questions, bank.Public(q, ""))
	}
	c.JSON(http.StatusOK, gin.H{
		"question_version": bank.QuestionVersion,
		"prompts":          bank.Prompts,
		"h008_by_parent":   bank.H008ByParent,
		"questions":        questions,
	})
}

func (s *Server) create(c *gin.Context) {
	var body struct {
		IdempotencyKey string          `json:"idempotency_key"`
		Profile        service.Profile `json:"profile"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		writeError(c, &service.CodeError{HTTP: 400, Code: "MISSING_FIELD", Message: "请求格式不正确"})
		return
	}
	item, err := s.svc.Create(userID(c), body.IdempotencyKey, body.Profile)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusCreated, item)
}

func (s *Server) get(c *gin.Context) {
	item, err := s.svc.Get(userID(c), c.Param("id"))
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, item)
}

func (s *Server) plan(c *gin.Context) {
	plan, err := s.svc.Plan(userID(c), c.Param("id"))
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, plan)
}

func (s *Server) patch(c *gin.Context) {
	var body struct {
		ExpectedRevision int                   `json:"expected_revision"`
		Answers          []service.AnswerPatch `json:"answers"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		writeError(c, &service.CodeError{HTTP: 400, Code: "MISSING_FIELD", Message: "请求格式不正确"})
		return
	}
	plan, err := s.svc.Patch(userID(c), c.Param("id"), body.ExpectedRevision, body.Answers)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, plan)
}

func (s *Server) deferBranch(c *gin.Context) {
	var body struct {
		ExpectedRevision int    `json:"expected_revision"`
		Branch           string `json:"branch"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		writeError(c, &service.CodeError{HTTP: 400, Code: "MISSING_FIELD", Message: "请求格式不正确"})
		return
	}
	plan, err := s.svc.Defer(userID(c), c.Param("id"), body.Branch, body.ExpectedRevision)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, plan)
}

func (s *Server) submit(c *gin.Context) {
	var body struct {
		ExpectedRevision int  `json:"expected_revision"`
		AllowPartial     bool `json:"allow_partial"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		writeError(c, &service.CodeError{HTTP: 400, Code: "MISSING_FIELD", Message: "请求格式不正确"})
		return
	}
	report, err := s.svc.Submit(userID(c), c.Param("id"), body.ExpectedRevision, body.AllowPartial)
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, report)
}

func (s *Server) report(c *gin.Context) {
	report, err := s.svc.Report(userID(c), c.Param("id"))
	if err != nil {
		writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, report)
}

func userID(c *gin.Context) string {
	if id := c.GetHeader("X-User-Id"); id != "" {
		return id
	}
	return "dev-user"
}

func writeError(c *gin.Context, err error) {
	coded := &service.CodeError{HTTP: 500, Code: "INTERNAL", Message: err.Error()}
	if target, ok := err.(*service.CodeError); ok {
		coded = target
	}
	c.JSON(coded.HTTP, gin.H{"code": coded.Code, "message": coded.Message})
}
