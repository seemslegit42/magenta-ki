package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"go-appwrite/main/internal/appwrite"
	"go-appwrite/main/internal/middleware"
)

// ListProjects returns projects for the authenticated user or scoped to an authorized team
func ListProjects(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r.Context())
	teamID := strings.TrimSpace(r.URL.Query().Get("teamId"))

	var projects []appwrite.Project
	var err error

	if teamID != "" {
		if !user.HasTeam(teamID) {
			http.Error(w, "Forbidden: not a member of specified team", http.StatusForbidden)
			return
		}
		projects, err = appwrite.Projects.ListByTeam(teamID)
	} else {
		projects, err = appwrite.Projects.ListByOwner(user.ID)
	}

	if err != nil {
		http.Error(w, "Failed to fetch projects: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"projects": projects})
}

// CreateProject inserts a new project with ownership bound to user.ID and teamId
func CreateProject(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r.Context())

	var input struct {
		Name        string  `json:"name"`
		Title       string  `json:"title"`
		Description *string `json:"description"`
		TeamID      *string `json:"teamId"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
		return
	}

	projectName := strings.TrimSpace(input.Name)
	if projectName == "" {
		projectName = strings.TrimSpace(input.Title)
	}
	if projectName == "" {
		http.Error(w, "Project name is required", http.StatusBadRequest)
		return
	}

	if input.TeamID != nil && *input.TeamID != "" {
		if !user.HasTeam(*input.TeamID) {
			http.Error(w, "Forbidden: not authorized to create project for team", http.StatusForbidden)
			return
		}
	}

	project := appwrite.Project{
		Name:        projectName,
		Description: input.Description,
		CreatedBy:   user.ID,
		TeamID:      input.TeamID,
	}

	created, err := appwrite.Projects.Create(project)
	if err != nil {
		http.Error(w, "Failed to create project: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"project": created})
}

// GetProject retrieves a project by ID ensuring the user is creator or team member
func GetProject(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r.Context())
	projectID := strings.TrimSpace(r.URL.Query().Get("id"))
	if projectID == "" {
		http.Error(w, "Project ID is required", http.StatusBadRequest)
		return
	}

	project, err := appwrite.Projects.GetWithOwnership(projectID, user.ID, user.Teams)
	if err != nil {
		if strings.Contains(err.Error(), "forbidden") {
			http.Error(w, err.Error(), http.StatusForbidden)
			return
		}
		http.Error(w, "Project not found: "+err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"project": project})
}

// UpdateProject modifies an existing project and rejects attempts to modify createdBy or teamId
func UpdateProject(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r.Context())
	projectID := strings.TrimSpace(r.URL.Query().Get("id"))
	if projectID == "" {
		http.Error(w, "Project ID is required", http.StatusBadRequest)
		return
	}

	var updatePayload map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&updatePayload); err != nil {
		http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
		return
	}

	updated, err := appwrite.Projects.Update(projectID, user.ID, updatePayload, user.Teams)
	if err != nil {
		if strings.Contains(err.Error(), "forbidden") {
			http.Error(w, err.Error(), http.StatusForbidden)
			return
		}
		if strings.Contains(err.Error(), "immutable") || strings.Contains(err.Error(), "validation error") {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		http.Error(w, "Failed to update project: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"project": updated})
}

// DeleteProject deletes a project verifying ownership before removal
func DeleteProject(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r.Context())
	projectID := strings.TrimSpace(r.URL.Query().Get("id"))
	if projectID == "" {
		http.Error(w, "Project ID is required", http.StatusBadRequest)
		return
	}

	if err := appwrite.Projects.Delete(projectID, user.ID, user.Teams); err != nil {
		if strings.Contains(err.Error(), "forbidden") {
			http.Error(w, err.Error(), http.StatusForbidden)
			return
		}
		http.Error(w, "Failed to delete project: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "deletedId": projectID})
}
