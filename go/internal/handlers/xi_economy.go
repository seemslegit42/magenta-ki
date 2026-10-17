package handlers

import (
	"encoding/json"
	"net/http"

	"go-appwrite/main/internal/services"
)

var xiService = services.NewXiEconomyService()

func GetXiFloor(w http.ResponseWriter, r *http.Request) {
	floor := xiService.GetFloor()
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(floor)
}

func BurnXi(w http.ResponseWriter, r *http.Request) {
	var req services.BurnXiRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	resp, err := xiService.BurnXi(req)
	if err != nil {
		http.Error(w, "Failed to burn Xi", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(resp)
}

func CalculatePoAReward(w http.ResponseWriter, r *http.Request) {
	var req services.PoARewardRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	resp := xiService.CalculatePoAReward(req)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(resp)
}

func GetXiSankey(w http.ResponseWriter, r *http.Request) {
	sankey := xiService.GetSankeyFlow()
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(sankey)
}

func GetXiGovernance(w http.ResponseWriter, r *http.Request) {
	gov := xiService.GetGovernance()
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(gov)
}
