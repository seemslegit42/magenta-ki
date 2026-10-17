package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"go-appwrite/main/internal/appwrite"
	"go-appwrite/main/internal/middleware"
)

func ListItems(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r.Context())

	items, err := appwrite.Items.ListByOwner(user.ID)
	if err != nil {
		http.Error(w, "Failed to fetch items", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"items": items})
}

func CreateItem(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r.Context())

	var input struct {
		Title  string  `json:"title"`
		TeamID *string `json:"teamId"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	item, err := appwrite.Items.Create(map[string]interface{}{
		"title":       strings.TrimSpace(input.Title),
		"description": nil,
		"createdBy":   user.ID,
		"teamId":      input.TeamID,
	})
	if err != nil {
		http.Error(w, "Failed to create item", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"item": item})
}

func HealthCheck(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "healthy",
		"service": "Appwrite Go Gateway Service",
		"engine":  "TablesDB",
	})
}
