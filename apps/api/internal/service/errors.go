package service

import "fmt"

type CodeError struct {
	HTTP    int
	Code    string
	Message string
}

func (e *CodeError) Error() string {
	return e.Message
}

func fail(http int, code, message string) *CodeError {
	return &CodeError{HTTP: http, Code: code, Message: message}
}

func asCode(err error) *CodeError {
	if err == nil {
		return nil
	}
	if coded, ok := err.(*CodeError); ok {
		return coded
	}
	return fail(500, "INTERNAL", err.Error())
}

func wrapInvalid(err error) error {
	if err == nil {
		return nil
	}
	return fail(400, "INVALID_ANSWER", err.Error())
}

func missing(field string) error {
	return fail(400, "MISSING_FIELD", fmt.Sprintf("缺少%s", field))
}
