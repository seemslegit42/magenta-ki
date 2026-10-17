package appwrite

import (
	"os"
	"sync"

	"github.com/appwrite/sdk-for-go/appwrite"
)

var (
	client     *appwrite.Client
	once       sync.Once
	DatabaseID string
	BucketID   string
)

func GetClient() *appwrite.Client {
	once.Do(func() {
		client = appwrite.NewClient()
		client.SetEndpoint(os.Getenv("APPWRITE_ENDPOINT"))
		client.SetProject(os.Getenv("APPWRITE_PROJECT_ID"))
		client.SetKey(os.Getenv("APPWRITE_API_KEY"))

		DatabaseID = os.Getenv("APPWRITE_DATABASE_ID")
		BucketID = os.Getenv("APPWRITE_BUCKET_ID")
	})
	return client
}

func GetTablesDB() *appwrite.TablesDB {
	return appwrite.NewTablesDB(GetClient())
}

func GetStorage() *appwrite.Storage {
	return appwrite.NewStorage(GetClient())
}
