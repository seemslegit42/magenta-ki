package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHealthCheckHandler(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rec := httptest.NewRecorder()

	HealthCheck(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rec.Code)
	}

	var body map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("failed to decode JSON response: %v", err)
	}
	if body["status"] != "healthy" {
		t.Errorf("expected status healthy, got %v", body["status"])
	}
	if body["engine"] != "TablesDB" {
		t.Errorf("expected engine TablesDB, got %v", body["engine"])
	}
}

func TestGetXiFloorHandler(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/xi/floor", nil)
	rec := httptest.NewRecorder()

	GetXiFloor(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rec.Code)
	}

	var body map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if body["fiatPegCurrency"] != "CAD" {
		t.Errorf("expected fiatPegCurrency CAD, got %v", body["fiatPegCurrency"])
	}
	floor, ok := body["xiFloorUsd"].(float64)
	if !ok || floor <= 0 {
		t.Errorf("expected positive xiFloorUsd, got %v", body["xiFloorUsd"])
	}
}

func TestCalculatePoARewardHandler(t *testing.T) {
	payload := map[string]interface{}{
		"contributorId":       "usr_test_1",
		"datasetWeightNk":     200,
		"qualityFactorFk":     1.0,
		"efficacyImpactEdata": 1.0,
	}
	raw, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/api/xi/poa-reward", bytes.NewReader(raw))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	CalculatePoAReward(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rec.Code)
	}

	var body map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if body["contributorId"] != "usr_test_1" {
		t.Errorf("expected contributorId usr_test_1, got %v", body["contributorId"])
	}
	if body["rewardXi"] != 250.0 {
		t.Errorf("expected rewardXi 250.0 (1.25 * 200 * 1^1.5 * 1), got %v", body["rewardXi"])
	}
}

func TestCalculatePoARewardRejectsInvalidJSON(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/api/xi/poa-reward", bytes.NewBufferString("{bad-json"))
	rec := httptest.NewRecorder()

	CalculatePoAReward(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400 on malformed JSON, got %d", rec.Code)
	}
}

func TestGetXiSankeyAndGovernanceHandlers(t *testing.T) {
	reqSankey := httptest.NewRequest(http.MethodGet, "/api/xi/sankey", nil)
	recSankey := httptest.NewRecorder()
	GetXiSankey(recSankey, reqSankey)
	if recSankey.Code != http.StatusOK {
		t.Fatalf("expected status 200 for sankey, got %d", recSankey.Code)
	}

	reqGov := httptest.NewRequest(http.MethodGet, "/api/xi/governance", nil)
	recGov := httptest.NewRecorder()
	GetXiGovernance(recGov, reqGov)
	if recGov.Code != http.StatusOK {
		t.Fatalf("expected status 200 for governance, got %d", recGov.Code)
	}
}
