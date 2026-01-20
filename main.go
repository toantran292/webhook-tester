package main

import (
	"embed"
	"io/fs"
	"log"
	"net/http"
	"os"

	"webhook-tester/internal/database"
	"webhook-tester/internal/handlers"
	"webhook-tester/internal/sse"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

//go:embed static/*
var staticFiles embed.FS

func mustSub(fsys fs.FS, dir string) fs.FS {
	sub, err := fs.Sub(fsys, dir)
	if err != nil {
		panic(err)
	}
	return sub
}

func main() {
	// Get port from environment or default to 9847
	port := os.Getenv("PORT")
	if port == "" {
		port = "9847"
	}

	// Get database path from environment or default
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "webhook-tester.db"
	}

	// Initialize database
	if err := database.Init(dbPath); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// Create SSE broker
	broker := sse.NewBroker()
	go broker.Run()

	// Create handlers
	webhookHandler := handlers.NewWebhookHandler(broker)
	sseHandler := handlers.NewSSEHandler(broker)

	// Setup Gin router
	router := gin.Default()

	// CORS middleware
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// API routes
	api := router.Group("/api")
	{
		// Endpoints CRUD
		api.GET("/endpoints", handlers.ListEndpoints)
		api.POST("/endpoints", handlers.CreateEndpoint)
		api.GET("/endpoints/:id", handlers.GetEndpoint)
		api.PUT("/endpoints/:id", handlers.UpdateEndpoint)
		api.DELETE("/endpoints/:id", handlers.DeleteEndpoint)

		// Requests
		api.GET("/endpoints/:id/requests", handlers.ListRequests)
		api.DELETE("/endpoints/:id/requests", handlers.ClearRequests)
		api.GET("/requests/:id", handlers.GetRequest)

		// SSE
		api.GET("/sse", sseHandler.HandleSSE)
		api.GET("/sse/status", sseHandler.GetSSEStatus)
	}

	// Webhook receiver - accepts all HTTP methods
	router.Any("/hook/:slug", webhookHandler.HandleWebhook)

	// Serve static files (embedded React build)
	staticFS, err := fs.Sub(staticFiles, "static")
	if err != nil {
		log.Printf("Warning: Could not load embedded static files: %v", err)
	} else {
		// Serve static assets
		router.StaticFS("/assets", http.FS(mustSub(staticFS, "assets")))
		router.GET("/vite.svg", func(c *gin.Context) {
			data, _ := fs.ReadFile(staticFS, "vite.svg")
			c.Data(http.StatusOK, "image/svg+xml", data)
		})

		// Read index.html once
		indexHTML, _ := fs.ReadFile(staticFS, "index.html")

		// SPA fallback - serve index.html for all other routes
		router.NoRoute(func(c *gin.Context) {
			c.Data(http.StatusOK, "text/html; charset=utf-8", indexHTML)
		})
	}

	log.Printf("Server starting on port %s", port)
	log.Printf("Webhook URL: http://localhost:%s/hook/{slug}", port)
	log.Printf("API: http://localhost:%s/api", port)

	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
