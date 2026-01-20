package handlers

import (
	"net/http"
	"strconv"

	"webhook-tester/internal/database"
	"webhook-tester/internal/models"

	"github.com/gin-gonic/gin"
)

// ListRequests returns all requests for an endpoint
func ListRequests(c *gin.Context) {
	endpointID := c.Param("id")

	// Verify endpoint exists
	var endpoint models.Endpoint
	if result := database.GetDB().First(&endpoint, endpointID); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Endpoint not found"})
		return
	}

	// Get pagination params
	limit := 50
	offset := 0
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}
	if o := c.Query("offset"); o != "" {
		if parsed, err := strconv.Atoi(o); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	var requests []models.Request
	var total int64

	// Count total
	database.GetDB().Model(&models.Request{}).Where("endpoint_id = ?", endpointID).Count(&total)

	// Get requests
	result := database.GetDB().
		Where("endpoint_id = ?", endpointID).
		Order("received_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&requests)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"requests": requests,
		"total":    total,
		"limit":    limit,
		"offset":   offset,
	})
}

// GetRequest returns a single request by ID
func GetRequest(c *gin.Context) {
	id := c.Param("id")
	var request models.Request
	result := database.GetDB().Preload("Endpoint").First(&request, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Request not found"})
		return
	}
	c.JSON(http.StatusOK, request)
}

// ClearRequests deletes all requests for an endpoint
func ClearRequests(c *gin.Context) {
	endpointID := c.Param("id")

	// Verify endpoint exists
	var endpoint models.Endpoint
	if result := database.GetDB().First(&endpoint, endpointID); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Endpoint not found"})
		return
	}

	result := database.GetDB().Where("endpoint_id = ?", endpointID).Delete(&models.Request{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Requests cleared",
		"deleted": result.RowsAffected,
	})
}
