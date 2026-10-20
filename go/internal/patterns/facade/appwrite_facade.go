package facade

import (
	"log"
	"os"

	"github.com/appwrite/sdk-for-go/v7/appwrite"
	"github.com/appwrite/sdk-for-go/v7/client"
	"github.com/appwrite/sdk-for-go/v7/id"
	"github.com/appwrite/sdk-for-go/v7/tablesdb"
)

// AppwriteFacade provides a simplified interface to complex Appwrite TablesDB subsystem
type AppwriteFacade struct {
	client     client.Client
	tablesDB   *tablesdb.TablesDB
	databaseID string
	tableID    string
}

var instance *AppwriteFacade

func GetAppwriteFacade() *AppwriteFacade {
	if instance == nil {
		endpoint := os.Getenv("APPWRITE_ENDPOINT")
		if endpoint == "" {
			endpoint = "https://cloud.appwrite.io/v1"
		}
		projectID := os.Getenv("APPWRITE_PROJECT_ID")
		apiKey := os.Getenv("APPWRITE_API_KEY")

		cli := appwrite.NewClient(
			appwrite.WithEndpoint(endpoint),
			appwrite.WithProject(projectID),
			appwrite.WithKey(apiKey),
		)

		instance = &AppwriteFacade{
			client:     cli,
			tablesDB:   appwrite.NewTablesDB(cli),
			databaseID: os.Getenv("APPWRITE_DATABASE_ID"),
			tableID:    os.Getenv("APPWRITE_TABLE_ID"),
		}
		if instance.databaseID == "" {
			instance.databaseID = "TodosDB"
		}
		if instance.tableID == "" {
			instance.tableID = "Todos"
		}
	}
	return instance
}

func (f *AppwriteFacade) CreateRow(data map[string]interface{}, opts ...tablesdb.CreateRowOption) (map[string]interface{}, error) {
	rowID := id.Unique()
	doc, err := f.tablesDB.CreateRow(f.databaseID, f.tableID, rowID, data, opts...)
	if err != nil {
		log.Printf("[Facade Error] Failed to create row: %v", err)
		return nil, err
	}
	return doc.ToMap(), nil
}

func (f *AppwriteFacade) ListRows(opts ...tablesdb.ListRowsOption) (*tablesdb.RowList, error) {
	return f.tablesDB.ListRows(f.databaseID, f.tableID, opts...)
}

func (f *AppwriteFacade) DeleteRow(rowID string) error {
	_, err := f.tablesDB.DeleteRow(f.databaseID, f.tableID, rowID)
	return err
}

func (f *AppwriteFacade) GetDatabaseID() string {
	return f.databaseID
}

func (f *AppwriteFacade) GetTableID() string {
	return f.tableID
}
