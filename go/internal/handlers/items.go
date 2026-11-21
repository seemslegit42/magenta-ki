package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"go-appwrite/main/internal/appwrite"
	"go-appwrite/main/internal/middleware"
)

// ListItems fetches items owned by the authenticated user or scoped to a specific team
func ListItems(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r.Context())
	teamID := strings.TrimSpace(r.URL.Query().Get("teamId"))

	var items []map[string]interface{}
	var err error

	if teamID != "" {
		if !user.HasTeam(teamID) {
			http.Error(w, "Forbidden: not a member of specified team", http.StatusForbidden)
			return
		}
		items, err = appwrite.Items.ListByTeam(teamID)
	} else {
		items, err = appwrite.Items.ListByOwner(user.ID)
	}

	if err != nil {
		http.Error(w, "Failed to fetch items: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"items": items})
}

// CreateItem inserts a new item enforcing createdBy = user.ID and teamId validation
func CreateItem(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r.Context())

	var input struct {
		Title       string  `json:"title"`
		Description *string `json:"description"`
		TeamID      *string `json:"teamId"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
		return
	}

	title := strings.TrimSpace(input.Title)
	if title == "" {
		http.Error(w, "Title is required", http.StatusBadRequest)
		return
	}

	if input.TeamID != nil && *input.TeamID != "" {
		if !user.HasTeam(*input.TeamID) {
			http.Error(w, "Forbidden: not authorized to create item for team", http.StatusForbidden)
			return
		}
	}

	payload := map[string]interface{}{
		"title":       title,
		"description": input.Description,
		"createdBy":   user.ID,
		"teamId":      input.TeamID,
	}

	item, err := appwrite.Items.Create(payload)
	if err != nil {
		http.Error(w, "Failed to create item: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"item": item})
}

// GetItem retrieves an item and strictly enforces ownership or team membership
func GetItem(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r.Context())
	itemID := strings.TrimSpace(r.URL.Query().Get("id"))
	if itemID == "" {
		http.Error(w, "Item ID is required", http.StatusBadRequest)
		return
	}

	item, err := appwrite.Items.Get(itemID)
	if err != nil {
		http.Error(w, "Item not found: "+err.Error(), http.StatusNotFound)
		return
	}

	createdBy, _ := item["createdBy"].(string)
	teamID, _ := item["teamId"].(string)

	if createdBy != user.ID && (teamID == "" || !user.HasTeam(teamID)) {
		http.Error(w, "Forbidden: access denied to item", http.StatusForbidden)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"item": item})
}

// UpdateItem verifies ownership before mutating item; createdBy and teamId are immutable
func UpdateItem(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r.Context())
	itemID := strings.TrimSpace(r.URL.Query().Get("id"))
	if itemID == "" {
		http.Error(w, "Item ID is required", http.StatusBadRequest)
		return
	}

	existing, err := appwrite.Items.Get(itemID)
	if err != nil {
		http.Error(w, "Item not found: "+err.Error(), http.StatusNotFound)
		return
	}

	createdBy, _ := existing["createdBy"].(string)
	teamID, _ := existing["teamId"].(string)

	if createdBy != user.ID && (teamID == "" || !user.HasTeam(teamID)) {
		http.Error(w, "Forbidden: not authorized to update item", http.StatusForbidden)
		return
	}

	var updatePayload map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&updatePayload); err != nil {
		http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
		return
	}

	updated, err := appwrite.Items.Update(itemID, updatePayload)
	if err != nil {
		http.Error(w, "Failed to update item: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"item": updated})
}

// DeleteItem verifies ownership before removing an item
func DeleteItem(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r.Context())
	itemID := strings.TrimSpace(r.URL.Query().Get("id"))
	if itemID == "" {
		http.Error(w, "Item ID is required", http.StatusBadRequest)
		return
	}

	existing, err := appwrite.Items.Get(itemID)
	if err != nil {
		http.Error(w, "Item not found: "+err.Error(), http.StatusNotFound)
		return
	}

	createdBy, _ := existing["createdBy"].(string)
	teamID, _ := existing["teamId"].(string)

	if createdBy != user.ID && (teamID == "" || !user.HasTeam(teamID)) {
		http.Error(w, "Forbidden: not authorized to delete item", http.StatusForbidden)
		return
	}

	if err := appwrite.Items.Delete(itemID); err != nil {
		http.Error(w, "Failed to delete item: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "deletedId": itemID})
}

func HealthCheck(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "healthy",
		"service": "Database & Storage Gateway Service",
		"engine":  "TablesDB",
	})
}
