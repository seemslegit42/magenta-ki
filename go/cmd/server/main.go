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

	// Register API endpoints wrapped in Auth middleware
	mux.HandleFunc("GET /health", handlers.HealthCheck)
	mux.Handle("GET /api/items", middleware.AuthMiddleware(http.HandlerFunc(handlers.ListItems)))
	mux.Handle("POST /api/items", middleware.AuthMiddleware(http.HandlerFunc(handlers.CreateItem)))

	// Ξ (Xi) Economy & CogniOps API Routes
	mux.HandleFunc("GET /api/xi/floor", handlers.GetXiFloor)
	mux.HandleFunc("POST /api/xi/burn", handlers.BurnXi)
	mux.HandleFunc("POST /api/xi/poa-reward", handlers.CalculatePoAReward)
	mux.HandleFunc("GET /api/xi/sankey", handlers.GetXiSankey)
	mux.HandleFunc("GET /api/xi/governance", handlers.GetXiGovernance)

	// Appwrite Console & Instance Management Routes
	mux.Handle("GET /api/console/info", middleware.AuthMiddleware(http.HandlerFunc(handlers.GetConsoleInfo)))

	addr := fmt.Sprintf(":%s", port)
	log.Printf("Appwrite Go Server listening on %s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
