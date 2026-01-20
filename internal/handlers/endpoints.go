package handlers

import (
	"net/http"
	"strings"

	"webhook-tester/internal/database"
	"webhook-tester/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// CreateEndpointRequest represents the request body for creating an endpoint
type CreateEndpointRequest struct {
	Name            string            `json:"name" binding:"required"`
	Slug            string            `json:"slug"`
	SecretKey       string            `json:"secret_key"`
	ResponseStatus  int               `json:"response_status"`
	ResponseBody    string            `json:"response_body"`
	ResponseHeaders map[string]string `json:"response_headers"`
	DelayMs         int               `json:"delay_ms"`
	Enabled         *bool             `json:"enabled"`
}

// UpdateEndpointRequest represents the request body for updating an endpoint
type UpdateEndpointRequest struct {
	Name            *string           `json:"name"`
	SecretKey       *string           `json:"secret_key"`
	ResponseStatus  *int              `json:"response_status"`
	ResponseBody    *string           `json:"response_body"`
	ResponseHeaders map[string]string `json:"response_headers"`
	DelayMs         *int              `json:"delay_ms"`
	Enabled         *bool             `json:"enabled"`
}

// ListEndpoints returns all endpoints
func ListEndpoints(c *gin.Context) {
	var endpoints []models.Endpoint
	result := database.GetDB().Order("created_at DESC").Find(&endpoints)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusOK, endpoints)
}

// GetEndpoint returns a single endpoint by ID
func GetEndpoint(c *gin.Context) {
	id := c.Param("id")
	var endpoint models.Endpoint
	result := database.GetDB().First(&endpoint, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Endpoint not found"})
		return
	}
	c.JSON(http.StatusOK, endpoint)
}

// CreateEndpoint creates a new endpoint
func CreateEndpoint(c *gin.Context) {
	var req CreateEndpointRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Generate slug if not provided
	slug := req.Slug
	if slug == "" {
		slug = strings.ReplaceAll(uuid.New().String()[:8], "-", "")
	}

	// Default values
	responseStatus := req.ResponseStatus
	if responseStatus == 0 {
		responseStatus = 200
	}

	enabled := true
	if req.Enabled != nil {
		enabled = *req.Enabled
	}

	endpoint := models.Endpoint{
		Name:            req.Name,
		Slug:            slug,
		SecretKey:       req.SecretKey,
		ResponseStatus:  responseStatus,
		ResponseBody:    req.ResponseBody,
		ResponseHeaders: models.JSONMap(req.ResponseHeaders),
		DelayMs:         req.DelayMs,
		Enabled:         enabled,
	}

	result := database.GetDB().Create(&endpoint)
	if result.Error != nil {
		if strings.Contains(result.Error.Error(), "UNIQUE constraint") {
			c.JSON(http.StatusConflict, gin.H{"error": "Slug already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusCreated, endpoint)
}

// UpdateEndpoint updates an existing endpoint
func UpdateEndpoint(c *gin.Context) {
	id := c.Param("id")
	var endpoint models.Endpoint
	if result := database.GetDB().First(&endpoint, id); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Endpoint not found"})
		return
	}

	var req UpdateEndpointRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields if provided
	if req.Name != nil {
		endpoint.Name = *req.Name
	}
	if req.SecretKey != nil {
		endpoint.SecretKey = *req.SecretKey
	}
	if req.ResponseStatus != nil {
		endpoint.ResponseStatus = *req.ResponseStatus
	}
	if req.ResponseBody != nil {
		endpoint.ResponseBody = *req.ResponseBody
	}
	if req.ResponseHeaders != nil {
		endpoint.ResponseHeaders = models.JSONMap(req.ResponseHeaders)
	}
	if req.DelayMs != nil {
		endpoint.DelayMs = *req.DelayMs
	}
	if req.Enabled != nil {
		endpoint.Enabled = *req.Enabled
	}

	if result := database.GetDB().Save(&endpoint); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, endpoint)
}

// DeleteEndpoint deletes an endpoint and its requests
func DeleteEndpoint(c *gin.Context) {
	id := c.Param("id")
	var endpoint models.Endpoint
	if result := database.GetDB().First(&endpoint, id); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Endpoint not found"})
		return
	}

	// Delete associated requests first
	database.GetDB().Where("endpoint_id = ?", id).Delete(&models.Request{})

	// Delete the endpoint
	if result := database.GetDB().Delete(&endpoint); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Endpoint deleted"})
}
