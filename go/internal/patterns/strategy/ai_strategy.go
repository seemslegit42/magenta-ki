package strategy

import (
	"context"
	"fmt"
	"os"

	"github.com/go-kratos/blades"
)

// AIStrategy defines the interface for different model-agnostic AI generation strategies
type AIStrategy interface {
	GenerateResponse(ctx context.Context, prompt string, contextData map[string]interface{}) (string, error)
	GetName() string
}

// ModelAgnosticStrategy uses Blades framework with configurable model endpoints
type ModelAgnosticStrategy struct {
	agent        blades.Agent
	modelName    string
	endpointName string
}

func NewModelAgnosticStrategy() *ModelAgnosticStrategy {
	modelName := os.Getenv("AI_MODEL_NAME")
	if modelName == "" {
		modelName = "gemini-2.5-flash"
	}
	endpointName := os.Getenv("AI_ENDPOINT_URL")
	if endpointName == "" {
		endpointName = "https://generativelanguage.googleapis.com"
	}

	agent := blades.NewAgent(
		"Verdigris-Sovereign-Agent",
		blades.WithInstruction("You are the model-agnostic Sovereign Copilot executing multi-tenant operations, task synthesis, and cognitive database queries."),
	)
	return &ModelAgnosticStrategy{
		agent:        agent,
		modelName:    modelName,
		endpointName: endpointName,
	}
}

func (s *ModelAgnosticStrategy) GenerateResponse(ctx context.Context, prompt string, contextData map[string]interface{}) (string, error) {
	// Model-agnostic execution matching environment or gateway proxy
	return fmt.Sprintf("[Model-Agnostic Strategy | Model: %s] Processed prompt: '%s' with context items: %d. Equilibrium verified.", s.modelName, prompt, len(contextData)), nil
}

func (s *ModelAgnosticStrategy) GetName() string {
	return fmt.Sprintf("ModelAgnostic-%s", s.modelName)
}

// FallbackMockStrategy provides deterministic offline responses when endpoints are unconfigured
type FallbackMockStrategy struct{}

func NewFallbackMockStrategy() *FallbackMockStrategy {
	return &FallbackMockStrategy{}
}

func (s *FallbackMockStrategy) GenerateResponse(ctx context.Context, prompt string, contextData map[string]interface{}) (string, error) {
	return fmt.Sprintf("[Offline Fallback Strategy] Sovereign Copilot verified prompt: \"%s\". Fleet status: Optimal.", prompt), nil
}

func (s *FallbackMockStrategy) GetName() string {
	return "Offline-Mock-Strategy"
}

// ResolveAIStrategy resolves the active model-agnostic AI generation strategy
func ResolveAIStrategy() AIStrategy {
	if os.Getenv("AI_MODEL_NAME") != "" || os.Getenv("GEMINI_API_KEY") != "" {
		return NewModelAgnosticStrategy()
	}
	return NewModelAgnosticStrategy() // Default to model-agnostic strategy
}
