package services

import (
	"math/rand"
	"time"
)

type SystemMetrics struct {
	CPU      float64 `json:"cpu"`
	GPU      float64 `json:"gpu"`
	Memory   float64 `json:"memory"`
	IOPS     int     `json:"iops"`
	Security int     `json:"security_events"`
}

func StreamMetrics(metricsChan chan<- SystemMetrics) {
	ticker := time.NewTicker(100 * time.Millisecond)
	for range ticker.C {
		metricsChan <- SystemMetrics{
			CPU:      rand.Float64() * 100,
			GPU:      rand.Float64() * 100,
			Memory:   rand.Float64() * 100,
			IOPS:     rand.Intn(1000),
			Security: rand.Intn(5),
		}
	}
}
