package storage

import (
	"encoding/base64"
	"fmt"
	"os"
	"strings"

	"github.com/appwrite/sdk-for-go/appwrite"
	"github.com/appwrite/sdk-for-go/file"
	"github.com/appwrite/sdk-for-go/id"
)

var (
	client   *appwrite.Client
	storage  *appwrite.Storage
	BucketID string
)

func init() {
	client = appwrite.NewClient()
	client.SetEndpoint(os.Getenv("APPWRITE_ENDPOINT"))
	client.SetProject(os.Getenv("APPWRITE_PROJECT_ID"))
	client.SetKey(os.Getenv("APPWRITE_API_KEY"))

	storage = appwrite.NewStorage(client)
	BucketID = os.Getenv("APPWRITE_BUCKET_ID")
}

// Upload file from base64 string, returns File ID only
func Upload(base64Data, fileName, mimeType string) (string, error) {
	if idx := strings.Index(base64Data, ";base64,"); idx != -1 {
		base64Data = base64Data[idx+8:]
	}

	fileBytes, err := base64.StdEncoding.DecodeString(base64Data)
	if err != nil {
		return "", err
	}

	inputFile := file.NewInputFile(fileBytes, fileName)

	result, err := storage.CreateFile(BucketID, id.Unique(), inputFile)
	if err != nil {
		return "", err
	}

	return result.Id, nil
}

// GetAsDataUrl returns file as data URL for client consumption
func GetAsDataUrl(fileId, mimeType string) (string, error) {
	fileBytes, err := storage.GetFileDownload(BucketID, fileId)
	if err != nil {
		return "", err
	}

	base64Str := base64.StdEncoding.EncodeToString(fileBytes)
	return fmt.Sprintf("data:%s;base64,%s", mimeType, base64Str), nil
}

// GetPreviewUrl returns file preview URL
func GetPreviewUrl(fileId string, width, height int) string {
	return storage.GetFilePreview(BucketID, fileId,
		storage.WithGetFilePreviewWidth(width),
		storage.WithGetFilePreviewHeight(height))
}

// Delete removes a file
func Delete(fileId string) error {
	_, err := storage.DeleteFile(BucketID, fileId)
	return err
}

// DeleteMany removes multiple files (for cleanup)
func DeleteMany(fileIds []string) {
	for _, fileId := range fileIds {
		_ = Delete(fileId)
	}
}
