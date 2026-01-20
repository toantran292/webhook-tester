package handlers

import (
	"io"
	"net/http"
	"time"

	"webhook-tester/internal/database"
	"webhook-tester/internal/models"
	"webhook-tester/internal/sse"

	"github.com/gin-gonic/gin"
)

// WebhookHandler handles incoming webhook requests
type WebhookHandler struct {
	broker *sse.Broker
}

// NewWebhookHandler creates a new webhook handler
func NewWebhookHandler(broker *sse.Broker) *WebhookHandler {
	return &WebhookHandler{broker: broker}
}

// HandleWebhook receives webhook requests and stores them
func (h *WebhookHandler) HandleWebhook(c *gin.Context) {
	slug := c.Param("slug")

	// Find the endpoint
	var endpoint models.Endpoint
	result := database.GetDB().Where("slug = ?", slug).First(&endpoint)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Endpoint not found"})
		return
	}

	// Check if endpoint is enabled
	if !endpoint.Enabled {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Endpoint is disabled"})
		return
	}

	// Validate secret key if configured
	if endpoint.SecretKey != "" {
		providedSecret := c.GetHeader("X-Webhook-Secret")
		if providedSecret != endpoint.SecretKey {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or missing X-Webhook-Secret header"})
			return
		}
	}

	// Read request body
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read request body"})
		return
	}

	// Extract headers
	headers := make(models.JSONMap)
	for key, values := range c.Request.Header {
		if len(values) > 0 {
			headers[key] = values[0]
		}
	}

	// Get client IP
	clientIP := c.ClientIP()

	// Create request record
	request := models.Request{
		EndpointID:  endpoint.ID,
		Method:      c.Request.Method,
		Headers:     headers,
		Body:        string(body),
		QueryParams: c.Request.URL.RawQuery,
		SourceIP:    clientIP,
		ContentType: c.ContentType(),
		ReceivedAt:  time.Now(),
	}

	if result := database.GetDB().Create(&request); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save request"})
		return
	}

	// Broadcast to SSE clients
	h.broker.Publish("new_request", models.RequestWithEndpoint{
		Request:      request,
		EndpointSlug: endpoint.Slug,
		EndpointName: endpoint.Name,
	})

	// Apply delay if configured
	if endpoint.DelayMs > 0 {
		time.Sleep(time.Duration(endpoint.DelayMs) * time.Millisecond)
	}

	// Set custom response headers
	for key, value := range endpoint.ResponseHeaders {
		c.Header(key, value)
	}

	// Send configured response
	if endpoint.ResponseBody != "" {
		c.Data(endpoint.ResponseStatus, "application/json", []byte(endpoint.ResponseBody))
	} else {
		c.JSON(endpoint.ResponseStatus, gin.H{
			"status":  "received",
			"request": request.ID,
		})
	}
}
