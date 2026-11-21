package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"go-appwrite/main/internal/storage"
)

// UploadFile handles base64 file upload from client, returns File ID only
func UploadFile(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Base64Data string `json:"base64Data"`
		FileName   string `json:"fileName"`
		MimeType   string `json:"mimeType"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid upload request body: "+err.Error(), http.StatusBadRequest)
		return
	}

	if strings.TrimSpace(input.Base64Data) == "" {
		http.Error(w, "base64Data is required", http.StatusBadRequest)
		return
	}

	fileID, err := storage.Upload(input.Base64Data, input.FileName, input.MimeType)
	if err != nil {
		http.Error(w, "Failed to upload file: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Always return File ID only — never return raw binary or store base64 in database
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"fileId":   fileID,
		"fileName": input.FileName,
	})
}

// GetFileDataUrl fetches file bytes and converts to data URL for client consumption
func GetFileDataUrl(w http.ResponseWriter, r *http.Request) {
	fileID := strings.TrimSpace(r.URL.Query().Get("fileId"))
	mimeType := strings.TrimSpace(r.URL.Query().Get("mimeType"))
	if fileID == "" {
		http.Error(w, "fileId is required", http.StatusBadRequest)
		return
	}

	dataURL, err := storage.GetAsDataUrl(fileID, mimeType)
	if err != nil {
		http.Error(w, "Failed to get file: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"fileId":  fileID,
		"dataUrl": dataURL,
	})
}

// DeleteFile removes a file from storage
func DeleteFile(w http.ResponseWriter, r *http.Request) {
	fileID := strings.TrimSpace(r.URL.Query().Get("fileId"))
	if fileID == "" {
		http.Error(w, "fileId is required", http.StatusBadRequest)
		return
	}

	if err := storage.Delete(fileID); err != nil {
		http.Error(w, "Failed to delete file: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"fileId":  fileID,
	})
}
