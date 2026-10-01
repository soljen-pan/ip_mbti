package main

import (
	"log"
	"os"

	"ru-xi/api/internal/httpapi"
	"ru-xi/api/internal/questionset"
	"ru-xi/api/internal/service"
)

func main() {
	bank, err := questionset.Load()
	if err != nil {
		log.Fatal(err)
	}
	addr := os.Getenv("HTTP_ADDR")
	if addr == "" {
		addr = ":8080"
	}
	srv := httpapi.New(service.New(bank))
	log.Printf("ru-xi api listening on %s", addr)
	if err := srv.Router().Run(addr); err != nil {
		log.Fatal(err)
	}
}
