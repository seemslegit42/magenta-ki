package handlers

import (
	"encoding/json"
	"go-appwrite/main/internal/services"
	"net/http"
)

func TelemetrySSE(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	metricsChan := make(chan services.SystemMetrics)
	go services.StreamMetrics(metricsChan)

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	for metrics := range metricsChan {
		data, _ := json.Marshal(metrics)
		_, err := w.Write([]byte("data: " + string(data) + "\n\n"))
		if err != nil {
			return
		}
		flusher.Flush()
	}
}
