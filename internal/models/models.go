package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"
)

// JSONMap is a custom type for storing JSON objects in SQLite
type JSONMap map[string]string

func (j JSONMap) Value() (driver.Value, error) {
	if j == nil {
		return "{}", nil
	}
	return json.Marshal(j)
}

func (j *JSONMap) Scan(value interface{}) error {
	if value == nil {
		*j = make(JSONMap)
		return nil
	}
	var bytes []byte
	switch v := value.(type) {
	case []byte:
		bytes = v
	case string:
		bytes = []byte(v)
	default:
		return errors.New("type assertion to []byte or string failed")
	}
	return json.Unmarshal(bytes, j)
}

// Endpoint represents a webhook endpoint configuration
type Endpoint struct {
	ID              uint      `json:"id" gorm:"primaryKey"`
	Name            string    `json:"name" gorm:"not null"`
	Slug            string    `json:"slug" gorm:"uniqueIndex;not null"`
	SecretKey       string    `json:"secret_key" gorm:"default:''"`
	ResponseStatus  int       `json:"response_status" gorm:"default:200"`
	ResponseBody    string    `json:"response_body"`
	ResponseHeaders JSONMap   `json:"response_headers" gorm:"type:text"`
	DelayMs         int       `json:"delay_ms" gorm:"default:0"`
	Enabled         bool      `json:"enabled" gorm:"default:true"`
	CreatedAt       time.Time `json:"created_at"`
	Requests        []Request `json:"requests,omitempty" gorm:"foreignKey:EndpointID;constraint:OnDelete:CASCADE"`
}

// Request represents a captured webhook request
type Request struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	EndpointID  uint      `json:"endpoint_id" gorm:"index;not null"`
	Method      string    `json:"method"`
	Headers     JSONMap   `json:"headers" gorm:"type:text"`
	Body        string    `json:"body"`
	QueryParams string    `json:"query_params"`
	SourceIP    string    `json:"source_ip"`
	ContentType string    `json:"content_type"`
	ReceivedAt  time.Time `json:"received_at"`
	Endpoint    *Endpoint `json:"endpoint,omitempty" gorm:"foreignKey:EndpointID"`
}

// RequestWithEndpoint is used for SSE events to include endpoint info
type RequestWithEndpoint struct {
	Request
	EndpointSlug string `json:"endpoint_slug"`
	EndpointName string `json:"endpoint_name"`
}
