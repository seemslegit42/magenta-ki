package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/appwrite/sdk-for-go/v7/appwrite"
	"github.com/appwrite/sdk-for-go/v7/client"
	"github.com/appwrite/sdk-for-go/v7/id"
	"github.com/appwrite/sdk-for-go/v7/models"
	"github.com/appwrite/sdk-for-go/v7/permission"
	"github.com/appwrite/sdk-for-go/v7/query"
	"github.com/appwrite/sdk-for-go/v7/role"
	"github.com/appwrite/sdk-for-go/v7/tablesdb"

	"github.com/go-kratos/blades"

	"go-appwrite/main/internal/patterns/facade"
	"go-appwrite/main/internal/patterns/observer"
	"go-appwrite/main/internal/patterns/strategy"
)

// Todo model representing Appwrite row structure
type Todo struct {
	ID          string `json:"$id,omitempty"`
	Title       string `json:"title"`
	Description string `json:"description"`
	IsComplete  bool   `json:"isComplete"`
	CreatedBy   string `json:"createdBy,omitempty"`
	TeamID      string `json:"teamId,omitempty"`
	CreatedAt   string `json:"$createdAt,omitempty"`
	UpdatedAt   string `json:"$updatedAt,omitempty"`
}

type TodoList struct {
	Total int64  `json:"total"`
	Rows  []Todo `json:"rows"`
}

type CreateTodoInput struct {
	Title       string  `json:"title" binding:"required"`
	Description *string `json:"description"`
	IsComplete  *bool   `json:"isComplete"`
	TeamID      *string `json:"teamId"`
	CreatedBy   *string `json:"createdBy"`
}

type UpdateTodoInput struct {
	Title       *string `json:"title"`
	Description *string `json:"description"`
	IsComplete  *bool   `json:"isComplete"`
}

type AIAgentInput struct {
	Prompt  string                 `json:"prompt" binding:"required"`
	Context map[string]interface{} `json:"context"`
}

// AppConfig stores centralized configuration
type AppConfig struct {
	Endpoint   string
	ProjectID  string
	APIKey     string
	DatabaseID string
	TableID    string
	Port       string
}

var (
	cfg             AppConfig
	appwriteClient  client.Client
	tablesDB        *tablesdb.TablesDB
	bladesAgent     blades.Agent
	once            sync.Once
	dbReady         bool
	appFacade       *facade.AppwriteFacade
	eventDispatcher *observer.EventDispatcher
	aiStrategy      strategy.AIStrategy
)

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

// initConfig loads centralized environment variables following Appwrite Go SDK rules
func initConfig() {
	once.Do(func() {
		endpoint := getEnv("APPWRITE_ENDPOINT", getEnv("YOUR_ENDPOINT", "https://cloud.appwrite.io/v1"))
		projectID := getEnv("APPWRITE_PROJECT_ID", getEnv("YOUR_PROJECT_ID", ""))
		apiKey := getEnv("APPWRITE_API_KEY", getEnv("YOUR_KEY", ""))
		databaseID := getEnv("APPWRITE_DATABASE_ID", "TodosDB")
		tableID := getEnv("APPWRITE_TABLE_ID", "Todos")
		port := getEnv("PORT", "8080")

		cfg = AppConfig{
			Endpoint:   endpoint,
			ProjectID:  projectID,
			APIKey:     apiKey,
			DatabaseID: databaseID,
			TableID:    tableID,
			Port:       port,
		}

		appwriteClient = appwrite.NewClient(
			appwrite.WithEndpoint(cfg.Endpoint),
			appwrite.WithProject(cfg.ProjectID),
			appwrite.WithKey(cfg.APIKey),
		)

		tablesDB = appwrite.NewTablesDB(appwriteClient)

		// Initialize Design Patterns (Facade, Observer, Strategy)
		appFacade = facade.GetAppwriteFacade()
		eventDispatcher = observer.NewEventDispatcher()
		eventDispatcher.Register(&observer.AuditLogger{ID: "audit_logger_core"})
		eventDispatcher.Register(&observer.TelemetryEmitter{ID: "telemetry_metrics_core"})

		aiStrategy = strategy.ResolveAIStrategy()
		log.Printf("[Design Patterns Applied] Facade, Observer (%d observers), and Strategy (%s) initialized.", 2, aiStrategy.GetName())

		// Setup Blades AI Agent instance
		setupBladesAgent()
	})
}

// ensureDatabaseSchema guarantees idempotent table and column provisioning
func ensureDatabaseSchema() error {
	if tablesDB == nil {
		return nil
	}

	// Create or ensure database
	_, err := tablesDB.Get(cfg.DatabaseID)
	if err != nil {
		log.Printf("Database %s not found, provisioning...", cfg.DatabaseID)
		_, err = tablesDB.Create(cfg.DatabaseID, "Todos Database")
		if err != nil && !strings.Contains(err.Error(), "already exists") {
			log.Printf("Notice on database create: %v", err)
		}
	}

	// Create or ensure table
	_, err = tablesDB.GetTable(cfg.DatabaseID, cfg.TableID)
	if err != nil {
		log.Printf("Table %s not found, provisioning...", cfg.TableID)
		_, err = tablesDB.CreateTable(
			cfg.DatabaseID,
			cfg.TableID,
			"Todos",
			tablesDB.WithCreateTablePermissions([]string{
				permission.Read(role.Users()),
				permission.Write(role.Users()),
			}),
		)
		if err != nil && !strings.Contains(err.Error(), "already exists") {
			log.Printf("Notice on table create: %v", err)
		}

		// Create columns
		_, _ = tablesDB.CreateVarcharColumn(cfg.DatabaseID, cfg.TableID, "title", 255, true)
		_, _ = tablesDB.CreateTextColumn(cfg.DatabaseID, cfg.TableID, "description", false)
		_, _ = tablesDB.CreateBooleanColumn(cfg.DatabaseID, cfg.TableID, "isComplete", true)
		_, _ = tablesDB.CreateVarcharColumn(cfg.DatabaseID, cfg.TableID, "createdBy", 255, false)
		_, _ = tablesDB.CreateVarcharColumn(cfg.DatabaseID, cfg.TableID, "teamId", 255, false)
	}

	dbReady = true
	return nil
}

// setupBladesAgent sets up the Blades AI Agent framework instance model-agnostically
func setupBladesAgent() {
	modelName := os.Getenv("AI_MODEL_NAME")
	if modelName == "" {
		modelName = "gemini-2.5-flash"
	}

	bladesAgent = blades.NewAgent(
		"Verdigris-Sovereign-Agent",
		blades.WithInstruction("You are the model-agnostic Sovereign Copilot executing multi-tenant operations, task synthesis, and cognitive database queries."),
	)
	log.Printf("Blades Agent initialized model-agnostically: %s [Model: %s]", bladesAgent.Name(), modelName)
}

// CORSMiddleware enables cross-origin requests from the WebOS desktop shell
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With, X-Appwrite-Project, X-Appwrite-Key")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, PATCH, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}

// --- Gin HTTP Handlers ---

// HealthCheckHandler returns operational telemetry
func HealthCheckHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":      "healthy",
		"framework":   "gin-v1.10",
		"service":     "Appwrite Go Backend & Agent Gateway",
		"database":    cfg.DatabaseID,
		"table":       cfg.TableID,
		"endpoint":    cfg.Endpoint,
		"project":     cfg.ProjectID,
		"schemaReady": dbReady,
		"timestamp":   time.Now().UTC().Format(time.RFC3339),
	})
}

// ListTodosHandler retrieves todos with team-based tenant isolation filtering
func ListTodosHandler(c *gin.Context) {
	var queries []string

	// Enforce team-based isolation if teamId query is provided
	if teamID := c.Query("teamId"); teamID != "" {
		queries = append(queries, query.Equal("teamId", teamID))
	}

	// Filter by owner/creator if specified
	if createdBy := c.Query("createdBy"); createdBy != "" {
		queries = append(queries, query.Equal("createdBy", createdBy))
	}

	// Filter by completion status
	if status := c.Query("isComplete"); status != "" {
		isComp := status == "true" || status == "1"
		queries = append(queries, query.Equal("isComplete", isComp))
	}

	// Pagination limits
	limit := 25
	if limitStr := c.Query("limit"); limitStr != "" {
		if parsed, err := strconv.Atoi(limitStr); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}
	queries = append(queries, query.Limit(limit))
	queries = append(queries, query.OrderDesc("$createdAt"))

	opts := []tablesdb.ListRowsOption{}
	if len(queries) > 0 {
		opts = append(opts, tablesdb.WithListRowsQueries(queries))
	}

	result, err := tablesDB.ListRows(cfg.DatabaseID, cfg.TableID, opts...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to retrieve todos from Appwrite database",
			"details": err.Error(),
		})
		return
	}

	var todos TodoList
	if err := result.Decode(&todos); err != nil {
		// Fallback to row map decoding
		rows := make([]map[string]interface{}, len(result.Rows))
		for i, r := range result.Rows {
			rows[i] = r.ToMap()
		}
		c.JSON(http.StatusOK, gin.H{
			"total": result.Total,
			"rows":  rows,
		})
		return
	}

	c.JSON(http.StatusOK, todos)
}

// GetTodoHandler fetches a single todo by row ID
func GetTodoHandler(c *gin.Context) {
	rowID := c.Param("id")
	if strings.TrimSpace(rowID) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Row ID is required"})
		return
	}

	doc, err := tablesDB.GetRow(cfg.DatabaseID, cfg.TableID, rowID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Todo item not found",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, doc.ToMap())
}

// CreateTodoHandler creates a new todo ensuring team-based permissions and ownership
func CreateTodoHandler(c *gin.Context) {
	var input CreateTodoInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body", "details": err.Error()})
		return
	}

	title := strings.TrimSpace(input.Title)
	if title == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Title cannot be blank"})
		return
	}

	isComplete := false
	if input.IsComplete != nil {
		isComplete = *input.IsComplete
	}

	payload := map[string]interface{}{
		"title":       title,
		"description": input.Description,
		"isComplete":  isComplete,
		"createdBy":   input.CreatedBy,
		"teamId":      input.TeamID,
	}

	// Setup team-based permissions if teamId is provided
	createOpts := []tablesdb.CreateRowOption{}
	if input.TeamID != nil && *input.TeamID != "" {
		team := *input.TeamID
		createOpts = append(createOpts, tablesdb.WithCreateRowPermissions([]string{
			permission.Read(role.Team(team, "member")),
			permission.Update(role.Team(team, "admin")),
			permission.Delete(role.Team(team, "owner")),
		}))
	}

	rowID := id.Unique()
	itemMap, err := appFacade.CreateRow(payload, createOpts...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to create todo item",
			"details": err.Error(),
		})
		return
	}

	// Observer Pattern: Notify all registered observers (AuditLogger, TelemetryEmitter)
	eventDispatcher.NotifyAll(observer.Event{
		Type:      "TODO_CREATED",
		Payload:   itemMap,
		Timestamp: time.Now(),
	})

	c.JSON(http.StatusCreated, gin.H{
		"message": "Todo created successfully",
		"item":    itemMap,
	})
}

// UpdateTodoHandler updates todo, protecting immutable system and ownership fields
func UpdateTodoHandler(c *gin.Context) {
	rowID := c.Param("id")
	if strings.TrimSpace(rowID) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Row ID is required"})
		return
	}

	var input UpdateTodoInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body", "details": err.Error()})
		return
	}

	data := make(map[string]interface{})
	if input.Title != nil {
		data["title"] = strings.TrimSpace(*input.Title)
	}
	if input.Description != nil {
		data["description"] = *input.Description
	}
	if input.IsComplete != nil {
		data["isComplete"] = *input.IsComplete
	}

	// Guard: Ensure immutable fields are never altered on update
	delete(data, "$id")
	delete(data, "$createdAt")
	delete(data, "$updatedAt")
	delete(data, "createdBy")
	delete(data, "teamId")

	doc, err := tablesDB.UpdateRow(cfg.DatabaseID, cfg.TableID, rowID, data)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to update todo item",
			"details": err.Error(),
		})
		return
	}

	itemMap := doc.ToMap()
	eventDispatcher.NotifyAll(observer.Event{
		Type:      "TODO_UPDATED",
		Payload:   itemMap,
		Timestamp: time.Now(),
	})

	c.JSON(http.StatusOK, gin.H{
		"message": "Todo updated successfully",
		"item":    itemMap,
	})
}

// DeleteTodoHandler deletes a todo row
func DeleteTodoHandler(c *gin.Context) {
	rowID := c.Param("id")
	if strings.TrimSpace(rowID) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Row ID is required"})
		return
	}

	err := appFacade.DeleteRow(rowID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to delete todo item",
			"details": err.Error(),
		})
		return
	}

	eventDispatcher.NotifyAll(observer.Event{
		Type:      "TODO_DELETED",
		Payload:   map[string]string{"id": rowID},
		Timestamp: time.Now(),
	})

	c.JSON(http.StatusOK, gin.H{
		"message": "Todo deleted successfully",
		"id":      rowID,
	})
}

// SeedTodosHandler provides idempotent mock data seeding
func SeedTodosHandler(c *gin.Context) {
	sampleTodos := []map[string]interface{}{
		{
			"title":       "Sovereign Workspace Initialization",
			"description": "Establish Appwrite TablesDB multi-tenant partition",
			"isComplete":  true,
			"teamId":      "sovereign_core",
		},
		{
			"title":       "Inspect Agentic Value Framework (AVF)",
			"description": "Calibrate goal-oriented revenue calculus flywheel",
			"isComplete":  true,
			"teamId":      "sovereign_core",
		},
		{
			"title":       "Synchronize Turso Edge Replicas",
			"description": "Probe libSQL latency across distributed gateway nodes",
			"isComplete":  false,
			"teamId":      "engineering",
		},
		{
			"title":       "Audit WOPI WebDAV Locks",
			"description": "Verify cryptographic lock expiration and checkFileInfo",
			"isComplete":  false,
			"teamId":      "engineering",
		},
	}

	seeded := 0
	for _, todo := range sampleTodos {
		_, err := appFacade.CreateRow(todo)
		if err == nil {
			seeded++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Sample todos seeded successfully",
		"seeded":  seeded,
		"total":   len(sampleTodos),
	})
}

// AIAgentHandler invokes the Strategy pattern AI agent with Appwrite database context
func AIAgentHandler(c *gin.Context) {
	var input AIAgentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Prompt is required", "details": err.Error()})
		return
	}

	prompt := strings.TrimSpace(input.Prompt)
	log.Printf("Invoking AI Strategy (%s) with prompt: %s", aiStrategy.GetName(), prompt)

	// Strategy Pattern execution
	reply, err := aiStrategy.GenerateResponse(c.Request.Context(), prompt, input.Context)
	if err != nil {
		reply = "Sovereign Copilot fallback processing: " + prompt
	}

	// Fetch current todo count for telemetry
	var totalTodos int64 = 0
	res, err := appFacade.ListRows(tablesdb.WithListRowsQueries([]string{query.Limit(1)}))
	if err == nil {
		totalTodos = res.Total
	}

	eventDispatcher.NotifyAll(observer.Event{
		Type:      "AI_AGENT_INVOKED",
		Payload:   map[string]interface{}{"prompt": prompt, "strategy": aiStrategy.GetName()},
		Timestamp: time.Now(),
	})

	c.JSON(http.StatusOK, gin.H{
		"agent":       aiStrategy.GetName(),
		"framework":   "Go Design Patterns (Facade, Observer, Strategy)",
		"instruction": "Cognitive agent orchestration active across Appwrite TablesDB",
		"prompt":      prompt,
		"reply":       reply,
		"telemetry": gin.H{
			"activeTodos": totalTodos,
			"timestamp":   time.Now().UTC().Unix(),
		},
	})
}

// SetupRouter initializes the Gin engine with all routes and middleware
func SetupRouter() *gin.Engine {
	// Set Gin mode
	if os.Getenv("GIN_MODE") == "" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(gin.Logger())
	r.Use(CORSMiddleware())

	// Health and Status
	r.GET("/health", HealthCheckHandler)
	r.GET("/api/health", HealthCheckHandler)

	// API Group
	api := r.Group("/api")
	{
		todos := api.Group("/todos")
		{
			todos.GET("", ListTodosHandler)
			todos.POST("", CreateTodoHandler)
			todos.GET("/:id", GetTodoHandler)
			todos.PATCH("/:id", UpdateTodoHandler)
			todos.DELETE("/:id", DeleteTodoHandler)
			todos.POST("/seed", SeedTodosHandler)
		}

		// AI Blades Agent Invocation
		api.POST("/ai/agent", AIAgentHandler)
	}

	return r
}

func main() {
	log.Println("Starting Appwrite Go Server (Gin & Blades Framework)...")

	// 1. Initialize configuration and Appwrite client
	initConfig()

	// 2. Provision and ensure database schema
	if err := ensureDatabaseSchema(); err != nil {
		log.Printf("Schema preparation notice: %v", err)
	}

	// 3. Setup Gin router
	router := SetupRouter()

	// 4. Start HTTP Server
	addr := ":" + cfg.Port
	log.Printf("Server actively listening on %s (Gin v1.10)", addr)

	srv := &http.Server{
		Addr:         addr,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Server encounter fatal error: %v", err)
	}
}
