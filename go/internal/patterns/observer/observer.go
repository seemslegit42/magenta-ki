package observer

import (
	"fmt"
	"log"
	"time"
)

// Event represents a system telemetry or audit event
type Event struct {
	Type      string
	Payload   interface{}
	Timestamp time.Time
}

// Observer defines the interface for receiving notification updates
type Observer interface {
	Update(event Event)
	GetID() string
}

// Subject defines the interface for managing and notifying observers
type Subject interface {
	Register(o Observer)
	Deregister(o Observer)
	NotifyAll(event Event)
}

// AuditLogger implements Observer to record system actions
type AuditLogger struct {
	ID string
}

func (a *AuditLogger) Update(event Event) {
	log.Printf("[AUDIT_OBSERVER] [%s] Event: %s | Payload: %+v at %s\n", a.ID, event.Type, event.Payload, event.Timestamp.Format(time.RFC3339))
}

func (a *AuditLogger) GetID() string {
	return a.ID
}

// TelemetryEmitter implements Observer for real-time metrics
type TelemetryEmitter struct {
	ID string
}

func (t *TelemetryEmitter) Update(event Event) {
	fmt.Printf("[TELEMETRY_OBSERVER] [%s] Metric dispatched for event type: %s\n", t.ID, event.Type)
}

func (t *TelemetryEmitter) GetID() string {
	return t.ID
}

// EventDispatcher acts as the Subject managing event observers
type EventDispatcher struct {
	observers []Observer
}

func NewEventDispatcher() *EventDispatcher {
	return &EventDispatcher{
		observers: make([]Observer, 0),
	}
}

func (d *EventDispatcher) Register(o Observer) {
	d.observers = append(d.observers, o)
}

func (d *EventDispatcher) Deregister(o Observer) {
	for i, obs := range d.observers {
		if obs.GetID() == o.GetID() {
			d.observers = append(d.observers[:i], d.observers[i+1:]...)
			break
		}
	}
}

func (d *EventDispatcher) NotifyAll(event Event) {
	for _, obs := range d.observers {
		obs.Update(event)
	}
}
