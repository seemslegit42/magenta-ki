package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"go-appwrite/main/internal/handlers"
	"go-appwrite/main/internal/middleware"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	mux := http.NewServeMux()

	// Health check
	mux.HandleFunc("GET /health", handlers.HealthCheck)

	// Items Data Access (wrapped in Auth middleware, strict ownership enforced)
	mux.Handle("GET /api/items", middleware.AuthMiddleware(http.HandlerFunc(handlers.ListItems)))
	mux.Handle("POST /api/items", middleware.AuthMiddleware(http.HandlerFunc(handlers.CreateItem)))
	mux.Handle("GET /api/items/get", middleware.AuthMiddleware(http.HandlerFunc(handlers.GetItem)))
	mux.Handle("PUT /api/items", middleware.AuthMiddleware(http.HandlerFunc(handlers.UpdateItem)))
	mux.Handle("DELETE /api/items", middleware.AuthMiddleware(http.HandlerFunc(handlers.DeleteItem)))

	// Projects Data Access (wrapped in Auth middleware, ownership enforcement, team queries & immutable createdBy/teamId)
	mux.Handle("GET /api/projects", middleware.AuthMiddleware(http.HandlerFunc(handlers.ListProjects)))
	mux.Handle("POST /api/projects", middleware.AuthMiddleware(http.HandlerFunc(handlers.CreateProject)))
	mux.Handle("GET /api/projects/get", middleware.AuthMiddleware(http.HandlerFunc(handlers.GetProject)))
	mux.Handle("PUT /api/projects", middleware.AuthMiddleware(http.HandlerFunc(handlers.UpdateProject)))
	mux.Handle("DELETE /api/projects", middleware.AuthMiddleware(http.HandlerFunc(handlers.DeleteProject)))

	// Centralized Storage Operations (Base64 <-> InputFile conversion rules)
	mux.Handle("POST /api/storage/upload", middleware.AuthMiddleware(http.HandlerFunc(handlers.UploadFile)))
	mux.Handle("GET /api/storage/download", middleware.AuthMiddleware(http.HandlerFunc(handlers.GetFileDataUrl)))
	mux.Handle("DELETE /api/storage/file", middleware.AuthMiddleware(http.HandlerFunc(handlers.DeleteFile)))

	// Centralized Messaging Operations (Email, Push, SMS)
	mux.Handle("POST /api/messaging/email", middleware.AuthMiddleware(http.HandlerFunc(handlers.SendEmailHandler)))
	mux.Handle("POST /api/messaging/push", middleware.AuthMiddleware(http.HandlerFunc(handlers.SendPushHandler)))
	mux.Handle("POST /api/messaging/sms", middleware.AuthMiddleware(http.HandlerFunc(handlers.SendSMSHandler)))

	// Economy & CogniOps API Routes
	mux.HandleFunc("GET /api/xi/floor", handlers.GetXiFloor)
	mux.HandleFunc("POST /api/xi/burn", handlers.BurnXi)
	mux.HandleFunc("POST /api/xi/poa-reward", handlers.CalculatePoAReward)
	mux.HandleFunc("GET /api/xi/sankey", handlers.GetXiSankey)
	mux.HandleFunc("GET /api/xi/governance", handlers.GetXiGovernance)

	// Telemetry
	mux.HandleFunc("GET /api/telemetry/sse", handlers.TelemetrySSE)

	// Console & Instance Management Routes
	mux.Handle("GET /api/console/info", middleware.AuthMiddleware(http.HandlerFunc(handlers.GetConsoleInfo)))

	addr := fmt.Sprintf(":%s", port)
	log.Printf("Appwrite Go Server listening on %s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
