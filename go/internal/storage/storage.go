package storage

import (
	"encoding/base64"
	"errors"
	"fmt"
	"os"
	"strings"
	"sync"

	"github.com/appwrite/sdk-for-go/appwrite"
	"github.com/appwrite/sdk-for-go/file"
	"github.com/appwrite/sdk-for-go/id"
)

var (
	client   *appwrite.Client
	storage  *appwrite.Storage
	once     sync.Once
	BucketID string
)

func getStorage() *appwrite.Storage {
	once.Do(func() {
		client = appwrite.NewClient()
		client.SetEndpoint(os.Getenv("APPWRITE_ENDPOINT"))
		client.SetProject(os.Getenv("APPWRITE_PROJECT_ID"))
		client.SetKey(os.Getenv("APPWRITE_API_KEY"))

		storage = appwrite.NewStorage(client)
		BucketID = os.Getenv("APPWRITE_BUCKET_ID")
		if BucketID == "" {
			BucketID = "default"
		}
	})
	return storage
}

// Upload accepts a base64 encoded payload, strips headers, decodes to raw bytes,
// wraps in InputFile, and uploads to Appwrite Storage.
// MANDATORY: Returns the created File ID only. Base64 strings must NEVER be stored in databases.
func Upload(base64Data, fileName, mimeType string) (string, error) {
	if strings.TrimSpace(base64Data) == "" {
		return "", errors.New("storage: base64Data cannot be empty")
	}

	// Strip data URL prefix if present (e.g. "data:image/png;base64,")
	if idx := strings.Index(base64Data, ";base64,"); idx != -1 {
		base64Data = base64Data[idx+8:]
	}

	fileBytes, err := base64.StdEncoding.DecodeString(base64Data)
	if err != nil {
		return "", fmt.Errorf("storage: failed to decode base64: %w", err)
	}

	if fileName == "" {
		fileName = fmt.Sprintf("file_%s", id.Unique())
	}

	inputFile := file.NewInputFile(fileBytes, fileName)
	svc := getStorage()

	result, err := svc.CreateFile(BucketID, id.Unique(), inputFile)
	if err != nil {
		return "", fmt.Errorf("storage: failed to upload file to bucket %s: %w", BucketID, err)
	}

	return result.Id, nil
}

// UploadWithPermissions uploads a file with explicit row/team-level permissions
func UploadWithPermissions(base64Data, fileName, mimeType string, permissions []string) (string, error) {
	if strings.TrimSpace(base64Data) == "" {
		return "", errors.New("storage: base64Data cannot be empty")
	}

	if idx := strings.Index(base64Data, ";base64,"); idx != -1 {
		base64Data = base64Data[idx+8:]
	}

	fileBytes, err := base64.StdEncoding.DecodeString(base64Data)
	if err != nil {
		return "", fmt.Errorf("storage: failed to decode base64: %w", err)
	}

	if fileName == "" {
		fileName = fmt.Sprintf("file_%s", id.Unique())
	}

	inputFile := file.NewInputFile(fileBytes, fileName)
	svc := getStorage()

	result, err := svc.CreateFile(
		BucketID,
		id.Unique(),
		inputFile,
		svc.WithCreateFilePermissions(permissions),
	)
	if err != nil {
		return "", fmt.Errorf("storage: failed to upload file with permissions: %w", err)
	}

	return result.Id, nil
}

// GetAsDataUrl fetches binary bytes from storage and converts to a base64 data URL for client consumption.
// MANDATORY: Never expose raw binary data directly to client.
func GetAsDataUrl(fileId, mimeType string) (string, error) {
	if fileId == "" {
		return "", errors.New("storage: fileId cannot be empty")
	}

	if mimeType == "" {
		mimeType = "application/octet-stream"
	}

	svc := getStorage()
	fileBytes, err := svc.GetFileDownload(BucketID, fileId)
	if err != nil {
		return "", fmt.Errorf("storage: failed to download file %s: %w", fileId, err)
	}

	base64Str := base64.StdEncoding.EncodeToString(fileBytes)
	return fmt.Sprintf("data:%s;base64,%s", mimeType, base64Str), nil
}

// GetPreviewUrl returns the signed file preview URL.
func GetPreviewUrl(fileId string, width, height int) string {
	svc := getStorage()
	opts := []appwrite.GetFilePreviewOption{}
	if width > 0 {
		opts = append(opts, svc.WithGetFilePreviewWidth(width))
	}
	if height > 0 {
		opts = append(opts, svc.WithGetFilePreviewHeight(height))
	}
	return svc.GetFilePreview(BucketID, fileId, opts...)
}

// Delete permanently removes a file from storage.
func Delete(fileId string) error {
	svc := getStorage()
	_, err := svc.DeleteFile(BucketID, fileId)
	if err != nil {
		return fmt.Errorf("storage: failed to delete file %s: %w", fileId, err)
	}
	return nil
}

// DeleteMany removes multiple files (for cleanup operations when parent rows are deleted).
func DeleteMany(fileIds []string) {
	for _, fileId := range fileIds {
		_ = Delete(fileId) // Continue cleanup even if individual file fails
	}
}
