package sse

import (
	"encoding/json"
	"log"
	"sync"
)

// Event represents an SSE event
type Event struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

// Client represents a connected SSE client
type Client struct {
	ID     string
	Events chan []byte
}

// Broker manages SSE client connections and event broadcasting
type Broker struct {
	clients    map[string]*Client
	register   chan *Client
	unregister chan *Client
	broadcast  chan Event
	mu         sync.RWMutex
}

// NewBroker creates a new SSE broker
func NewBroker() *Broker {
	return &Broker{
		clients:    make(map[string]*Client),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan Event, 100),
	}
}

// Run starts the broker's event loop
func (b *Broker) Run() {
	for {
		select {
		case client := <-b.register:
			b.mu.Lock()
			b.clients[client.ID] = client
			b.mu.Unlock()
			log.Printf("SSE client connected: %s (total: %d)", client.ID, len(b.clients))

		case client := <-b.unregister:
			b.mu.Lock()
			if _, ok := b.clients[client.ID]; ok {
				close(client.Events)
				delete(b.clients, client.ID)
			}
			b.mu.Unlock()
			log.Printf("SSE client disconnected: %s (total: %d)", client.ID, len(b.clients))

		case event := <-b.broadcast:
			data, err := json.Marshal(event)
			if err != nil {
				log.Printf("Error marshaling SSE event: %v", err)
				continue
			}

			b.mu.RLock()
			for _, client := range b.clients {
				select {
				case client.Events <- data:
				default:
					// Client buffer full, skip
					log.Printf("SSE client %s buffer full, skipping event", client.ID)
				}
			}
			b.mu.RUnlock()
		}
	}
}

// Subscribe registers a new client
func (b *Broker) Subscribe(clientID string) *Client {
	client := &Client{
		ID:     clientID,
		Events: make(chan []byte, 10),
	}
	b.register <- client
	return client
}

// Unsubscribe removes a client
func (b *Broker) Unsubscribe(client *Client) {
	b.unregister <- client
}

// Publish sends an event to all connected clients
func (b *Broker) Publish(eventType string, data interface{}) {
	b.broadcast <- Event{
		Type: eventType,
		Data: data,
	}
}

// ClientCount returns the number of connected clients
func (b *Broker) ClientCount() int {
	b.mu.RLock()
	defer b.mu.RUnlock()
	return len(b.clients)
}
