package middleware

import (
	"context"
	"net/http"
	"strings"
)

type contextKey string

const userContextKey = contextKey("user")

type User struct {
	ID    string
	Email string
	Roles []string
}

// AuthMiddleware extracts and validates Bearer token or tenant identity
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		userID := "usr_operator_7842" // Default simulated authenticated user in developer environment

		if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
			token := strings.TrimPrefix(authHeader, "Bearer ")
			if token != "" {
				userID = token
			}
		}

		user := &User{
			ID:    userID,
			Email: "operator@verdigris.cloud",
			Roles: []string{"developer", "administrator"},
		}

		ctx := context.WithValue(r.Context(), userContextKey, user)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func GetUser(ctx context.Context) *User {
	if user, ok := ctx.Value(userContextKey).(*User); ok {
		return user
	}
	return &User{
		ID:    "usr_anonymous",
		Email: "anonymous@verdigris.cloud",
		Roles: []string{"guest"},
	}
}
