package services

import (
	"os"

	"go-appwrite/main/internal/appwrite"
)

type ConsoleService struct{}

func NewConsoleService() *ConsoleService {
	return &ConsoleService{}
}

func (s *ConsoleService) GetInstanceInfo() map[string]interface{} {
	return map[string]interface{}{
		"endpoint":  os.Getenv("APPWRITE_ENDPOINT"),
		"projectId": os.Getenv("APPWRITE_PROJECT_ID"),
		"databaseId": appwrite.DatabaseID,
		"bucketId":   appwrite.BucketID,
		"status":     "connected",
		"mode":       "self-hosted",
	}
}
