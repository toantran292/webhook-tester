package handlers

import (
	"fmt"
	"io"

	"webhook-tester/internal/sse"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// SSEHandler handles Server-Sent Events connections
type SSEHandler struct {
	broker *sse.Broker
}

// NewSSEHandler creates a new SSE handler
func NewSSEHandler(broker *sse.Broker) *SSEHandler {
	return &SSEHandler{broker: broker}
}

// HandleSSE handles SSE connections
func (h *SSEHandler) HandleSSE(c *gin.Context) {
	// Set SSE headers
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Access-Control-Allow-Origin", "*")
	c.Header("X-Accel-Buffering", "no")

	// Generate client ID
	clientID := uuid.New().String()

	// Subscribe to broker
	client := h.broker.Subscribe(clientID)
	defer h.broker.Unsubscribe(client)

	// Send initial connection event
	c.SSEvent("connected", gin.H{"client_id": clientID})
	c.Writer.Flush()

	// Stream events
	c.Stream(func(w io.Writer) bool {
		select {
		case event, ok := <-client.Events:
			if !ok {
				return false
			}
			fmt.Fprintf(w, "data: %s\n\n", event)
			return true
		case <-c.Request.Context().Done():
			return false
		}
	})
}

// GetSSEStatus returns the current SSE connection count
func (h *SSEHandler) GetSSEStatus(c *gin.Context) {
	c.JSON(200, gin.H{
		"connected_clients": h.broker.ClientCount(),
	})
}
