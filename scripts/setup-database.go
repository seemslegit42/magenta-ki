package main

import (
	"fmt"
	"log"
	"os"

	"github.com/appwrite/sdk-for-go/appwrite"
	"github.com/appwrite/sdk-for-go/permission"
	"github.com/appwrite/sdk-for-go/role"
)

// Idempotent Database Setup Script for Appwrite TablesDB
// Usage:
//   export APPWRITE_ENDPOINT="http://localhost/v1"
//   export APPWRITE_PROJECT_ID="your-project"
//   export APPWRITE_API_KEY="your-api-key"
//   export APPWRITE_DATABASE_ID="verdigris_main"
//   go run scripts/setup-database.go

func main() {
	endpoint := os.Getenv("APPWRITE_ENDPOINT")
	if endpoint == "" {
		endpoint = "http://localhost/v1"
	}
	projectID := os.Getenv("APPWRITE_PROJECT_ID")
	apiKey := os.Getenv("APPWRITE_API_KEY")
	databaseID := os.Getenv("APPWRITE_DATABASE_ID")
	if databaseID == "" {
		databaseID = "verdigris_main"
	}

	log.Println("==================================================")
	log.Println("🚀 Appwrite Server SDK Database Setup Script")
	log.Printf("Endpoint: %s | Project: %s | Database: %s\n", endpoint, projectID, databaseID)
	log.Println("==================================================")

	client := appwrite.NewClient()
	client.SetEndpoint(endpoint)
	client.SetProject(projectID)
	client.SetKey(apiKey)

	tablesDB := appwrite.NewTablesDB(client)

	// Step 1: Ensure Tables exist idempotently
	setupTable := func(tableID, tableName string, permissions []string) {
		log.Printf("Initializing table [%s] (%s)...", tableID, tableName)
		_, err := tablesDB.CreateTable(
			databaseID,
			tableID,
			tableName,
			tablesDB.WithCreateTablePermissions(permissions),
		)
		if err != nil {
			log.Printf("ℹ️ Table [%s] might already exist or status: %v", tableID, err)
		} else {
			log.Printf("✅ Table [%s] created successfully", tableID)
		}
	}

	// 1. Items table with team and owner permissions
	setupTable("items", "Items", []string{
		permission.Read(role.Users()),
		permission.Create(role.Users()),
		permission.Update(role.Users()),
		permission.Delete(role.Users()),
	})

	// 2. Projects table with team-based access
	setupTable("projects", "Projects", []string{
		permission.Read(role.Team("team_enterprise_alpha")),
		permission.Create(role.Team("team_enterprise_alpha", "member")),
		permission.Update(role.Team("team_enterprise_alpha", "admin")),
		permission.Delete(role.Team("team_enterprise_alpha", "owner")),
	})

	// 3. Xi Transactions table for CogniOps ledger
	setupTable("xi_transactions", "XiTransactions", []string{
		permission.Read(role.Users()),
		permission.Create(role.Users()),
	})

	// Step 2: Define Columns on Items table
	log.Println("Defining columns on [items] table...")
	_, _ = tablesDB.CreateVarcharColumn(databaseID, "items", "title", 255, true)
	_, _ = tablesDB.CreateTextColumn(databaseID, "items", "description", false)
	_, _ = tablesDB.CreateVarcharColumn(databaseID, "items", "createdBy", 255, true)
	_, _ = tablesDB.CreateVarcharColumn(databaseID, "items", "teamId", 255, false)

	// Step 3: Define Performance Indexes
	log.Println("Creating performance indexes...")
	_, _ = tablesDB.CreateIndex(databaseID, "items", "idx_items_created_by", "key", []string{"createdBy"})
	_, _ = tablesDB.CreateIndex(databaseID, "items", "idx_items_team_id", "key", []string{"teamId"})

	log.Println("🎉 Database setup and schema migration completed successfully!")
}
