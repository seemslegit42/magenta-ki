package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"go-appwrite/main/internal/messaging"
)

// SendEmailHandler dispatches email messages via Appwrite Messaging SDK wrapper
func SendEmailHandler(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Subject string   `json:"subject"`
		Content string   `json:"content"`
		Users   []string `json:"users"`
		Topics  []string `json:"topics"`
		Targets []string `json:"targets"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid email request body: "+err.Error(), http.StatusBadRequest)
		return
	}

	if strings.TrimSpace(input.Subject) == "" || strings.TrimSpace(input.Content) == "" {
		http.Error(w, "Subject and content are required", http.StatusBadRequest)
		return
	}

	msg, err := messaging.SendEmail(input.Subject, input.Content, input.Users, input.Topics, input.Targets)
	if err != nil {
		http.Error(w, "Failed to send email: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"message": msg})
}

// SendPushHandler dispatches push notifications via Appwrite Messaging SDK wrapper
func SendPushHandler(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Title   string                 `json:"title"`
		Body    string                 `json:"body"`
		Users   []string               `json:"users"`
		Topics  []string               `json:"topics"`
		Targets []string               `json:"targets"`
		Data    map[string]interface{} `json:"data"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid push request body: "+err.Error(), http.StatusBadRequest)
		return
	}

	if strings.TrimSpace(input.Title) == "" || strings.TrimSpace(input.Body) == "" {
		http.Error(w, "Title and body are required", http.StatusBadRequest)
		return
	}

	msg, err := messaging.SendPush(input.Title, input.Body, input.Users, input.Topics, input.Targets, input.Data)
	if err != nil {
		http.Error(w, "Failed to send push notification: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"message": msg})
}

// SendSMSHandler dispatches SMS text messages via Appwrite Messaging SDK wrapper
func SendSMSHandler(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Content string   `json:"content"`
		Users   []string `json:"users"`
		Topics  []string `json:"topics"`
		Targets []string `json:"targets"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid SMS request body: "+err.Error(), http.StatusBadRequest)
		return
	}

	if strings.TrimSpace(input.Content) == "" {
		http.Error(w, "Content is required", http.StatusBadRequest)
		return
	}

	msg, err := messaging.SendSMS(input.Content, input.Users, input.Topics, input.Targets)
	if err != nil {
		http.Error(w, "Failed to send SMS: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"message": msg})
}
