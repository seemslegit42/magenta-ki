package main

import (
	"fmt"
	"log"
	"os"

	"github.com/appwrite/sdk-for-go/v7/appwrite"
	"github.com/appwrite/sdk-for-go/v7/client"
	"github.com/appwrite/sdk-for-go/v7/id"
	"github.com/appwrite/sdk-for-go/v7/models"
	"github.com/appwrite/sdk-for-go/v7/query"
	"github.com/appwrite/sdk-for-go/v7/tablesdb"
)

var (
	appwriteClient client.Client
	todoDatabase   *models.Database
	todoTable      *models.Table
	tablesDB       *tablesdb.TablesDB
)

type Todo struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	IsComplete  bool   `json:"isComplete"`
}

type TodoList struct {
	*models.RowList
	Rows []Todo `json:"rows"`
}

func prepareDatabase() {
	tablesDB = appwrite.NewTablesDB(appwriteClient)

	// Create Database
	var err error
	todoDatabase, err = tablesDB.Create(
		id.Unique(),
		"TodosDB",
	)
	if err != nil {
		log.Printf("Error creating database: %v\n", err)
		return
	}

	// Create Table
	todoTable, err = tablesDB.CreateTable(
		todoDatabase.Id,
		id.Unique(),
		"Todos",
	)
	if err != nil {
		log.Printf("Error creating table: %v\n", err)
		return
	}

	// Create Columns
	_, _ = tablesDB.CreateVarcharColumn(todoDatabase.Id, todoTable.Id, "title", 255, true)
	_, _ = tablesDB.CreateTextColumn(todoDatabase.Id, todoTable.Id, "description", false)
	_, _ = tablesDB.CreateBooleanColumn(todoDatabase.Id, todoTable.Id, "isComplete", true)
}

func seedDatabase() {
	testTodo1 := map[string]interface{}{
		"title":       "Buy apples",
		"description": "At least 2KGs",
		"isComplete":  true,
	}

	testTodo2 := map[string]interface{}{
		"title":      "Wash the apples",
		"isComplete": true,
	}

	testTodo3 := map[string]interface{}{
		"title":       "Cut the apples",
		"description": "Don't forget to pack them in a box",
		"isComplete":  false,
	}

	_, _ = tablesDB.CreateRow(todoDatabase.Id, todoTable.Id, id.Unique(), testTodo1)
	_, _ = tablesDB.CreateRow(todoDatabase.Id, todoTable.Id, id.Unique(), testTodo2)
	_, _ = tablesDB.CreateRow(todoDatabase.Id, todoTable.Id, id.Unique(), testTodo3)
}

func getTodos() {
	todoResponse, err := tablesDB.ListRows(todoDatabase.Id, todoTable.Id)
	if err != nil {
		log.Printf("Error listing rows: %v\n", err)
		return
	}

	var todos TodoList
	_ = todoResponse.Decode(&todos)

	fmt.Println("Todos:")
	for _, todo := range todos.Rows {
		fmt.Printf("Title: %s\nDescription: %s\nIs Todo Complete: %t\n\n", todo.Title, todo.Description, todo.IsComplete)
	}
}

func getCompletedTodos() {
	todoResponse, err := tablesDB.ListRows(
		todoDatabase.Id,
		todoTable.Id,
		tablesDB.WithListRowsQueries([]string{
			query.Equal("isComplete", true),
			query.OrderDesc("$createdAt"),
			query.Limit(5),
		}),
	)
	if err != nil {
		log.Printf("Error listing completed rows: %v\n", err)
		return
	}

	var todos TodoList
	_ = todoResponse.Decode(&todos)

	fmt.Println("Completed todos (limited to 5):")
	for _, todo := range todos.Rows {
		fmt.Printf("Title: %s\nDescription: %s\nIs Todo Complete: %t\n\n", todo.Title, todo.Description, todo.IsComplete)
	}
}

func getIncompleteTodos() {
	todoResponse, err := tablesDB.ListRows(
		todoDatabase.Id,
		todoTable.Id,
		tablesDB.WithListRowsQueries([]string{
			query.Equal("isComplete", false),
			query.OrderAsc("title"),
		}),
	)
	if err != nil {
		log.Printf("Error listing incomplete rows: %v\n", err)
		return
	}

	var todos TodoList
	_ = todoResponse.Decode(&todos)

	fmt.Println("Incomplete todos (ordered by title):")
	for _, todo := range todos.Rows {
		fmt.Printf("Title: %s\nDescription: %s\nIs Todo Complete: %t\n\n", todo.Title, todo.Description, todo.IsComplete)
	}
}

func main() {
	endpoint := os.Getenv("YOUR_ENDPOINT")
	if endpoint == "" {
		endpoint = "https://cloud.appwrite.io/v1"
	}

	appwriteClient = appwrite.NewClient(
		appwrite.WithEndpoint(endpoint),
		appwrite.WithProject(os.Getenv("YOUR_PROJECT_ID")),
		appwrite.WithKey(os.Getenv("YOUR_KEY")),
	)

	prepareDatabase()
	seedDatabase()
	getTodos()
	getCompletedTodos()
	getIncompleteTodos()
}
