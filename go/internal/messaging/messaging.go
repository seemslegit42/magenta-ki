package messaging

import (
	"errors"
	"fmt"
	"strings"

	"github.com/appwrite/sdk-for-go/id"
	"go-appwrite/main/internal/appwrite"
)

// MessagingManager provides centralized wrapper functions for all Appwrite Messaging operations.
// Direct invocation of the SDK outside this wrapper is strictly prohibited by architecture rules.
type MessagingManager struct{}

var DefaultManager = &MessagingManager{}

// SendEmail dispatches transactional emails or notifications
func (m *MessagingManager) SendEmail(subject, content string, users, topics, targets []string) (map[string]interface{}, error) {
	subject = strings.TrimSpace(subject)
	content = strings.TrimSpace(content)
	if subject == "" || content == "" {
		return nil, errors.New("messaging: email subject and content cannot be empty")
	}

	msgService := appwrite.GetMessaging()
	messageID := id.Unique()

	// In Appwrite Go SDK, createEmail handles email dispatch
	msg, err := msgService.CreateEmail(
		messageID,
		subject,
		content,
		msgService.WithCreateEmailTopics(topics),
		msgService.WithCreateEmailUsers(users),
		msgService.WithCreateEmailTargets(targets),
	)
	if err != nil {
		return nil, fmt.Errorf("messaging: failed to send email: %w", err)
	}

	return msg.ToMap(), nil
}

// SendPush dispatches push notifications to mobile or web clients
func (m *MessagingManager) SendPush(title, body string, users, topics, targets []string, data map[string]interface{}) (map[string]interface{}, error) {
	title = strings.TrimSpace(title)
	body = strings.TrimSpace(body)
	if title == "" || body == "" {
		return nil, errors.New("messaging: push title and body cannot be empty")
	}

	msgService := appwrite.GetMessaging()
	messageID := id.Unique()

	msg, err := msgService.CreatePush(
		messageID,
		title,
		body,
		msgService.WithCreatePushTopics(topics),
		msgService.WithCreatePushUsers(users),
		msgService.WithCreatePushTargets(targets),
		msgService.WithCreatePushData(data),
	)
	if err != nil {
		return nil, fmt.Errorf("messaging: failed to send push notification: %w", err)
	}

	return msg.ToMap(), nil
}

// SendSMS dispatches text messages or verification codes
func (m *MessagingManager) SendSMS(content string, users, topics, targets []string) (map[string]interface{}, error) {
	content = strings.TrimSpace(content)
	if content == "" {
		return nil, errors.New("messaging: sms content cannot be empty")
	}

	msgService := appwrite.GetMessaging()
	messageID := id.Unique()

	msg, err := msgService.CreateSms(
		messageID,
		content,
		msgService.WithCreateSmsTopics(topics),
		msgService.WithCreateSmsUsers(users),
		msgService.WithCreateSmsTargets(targets),
	)
	if err != nil {
		return nil, fmt.Errorf("messaging: failed to send SMS: %w", err)
	}

	return msg.ToMap(), nil
}

// SubscribeTopic subscribes a specific target to a broadcast topic
func (m *MessagingManager) SubscribeTopic(topicID, subscriberID, targetID string) (map[string]interface{}, error) {
	if topicID == "" || subscriberID == "" || targetID == "" {
		return nil, errors.New("messaging: topicID, subscriberID and targetID are required")
	}

	msgService := appwrite.GetMessaging()
	sub, err := msgService.CreateSubscriber(topicID, subscriberID, targetID)
	if err != nil {
		return nil, fmt.Errorf("messaging: failed to subscribe to topic: %w", err)
	}

	return sub.ToMap(), nil
}

// UnsubscribeTopic removes a subscriber from a broadcast topic
func (m *MessagingManager) UnsubscribeTopic(topicID, subscriberID string) error {
	if topicID == "" || subscriberID == "" {
		return errors.New("messaging: topicID and subscriberID are required")
	}

	msgService := appwrite.GetMessaging()
	_, err := msgService.DeleteSubscriber(topicID, subscriberID)
	if err != nil {
		return fmt.Errorf("messaging: failed to unsubscribe from topic: %w", err)
	}

	return nil
}

// Package-level convenience functions using the centralized manager
func SendEmail(subject, content string, users, topics, targets []string) (map[string]interface{}, error) {
	return DefaultManager.SendEmail(subject, content, users, topics, targets)
}

func SendPush(title, body string, users, topics, targets []string, data map[string]interface{}) (map[string]interface{}, error) {
	return DefaultManager.SendPush(title, body, users, topics, targets, data)
}

func SendSMS(content string, users, topics, targets []string) (map[string]interface{}, error) {
	return DefaultManager.SendSMS(content, users, topics, targets)
}
