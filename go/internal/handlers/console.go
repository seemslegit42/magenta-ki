package handlers

import (
	"encoding/json"
	"net/http"

	"go-appwrite/main/internal/services"
)

var consoleService = services.NewConsoleService()

func GetConsoleInfo(w http.ResponseWriter, r *http.Request) {
	info := consoleService.GetInstanceInfo()
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(info)
}
