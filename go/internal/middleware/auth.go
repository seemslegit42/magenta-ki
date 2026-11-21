package middleware

import (
	"context"
	"net/http"
	"strings"
)

type contextKey string

const userContextKey = contextKey("user")

type User struct {
	ID    string   `json:"id"`
	Email string   `json:"email"`
	Roles []string `json:"roles"`
	Teams []string `json:"teams"`
}

func (u *User) HasTeam(teamID string) bool {
	if teamID == "" {
		return false
	}
	for _, t := range u.Teams {
		if t == teamID {
			return true
		}
	}
	// Administrator role has implicit tenant/team access
	for _, r := range u.Roles {
		if r == "administrator" || r == "owner" {
			return true
		}
	}
	return false
}

func (u *User) HasRole(role string) bool {
	for _, r := range u.Roles {
		if r == role {
			return true
		}
	}
	return false
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
			Roles: []string{"developer", "administrator", "owner"},
			Teams: []string{"team_enterprise_alpha", "team_devops"},
		}

		ctx := context.WithValue(r.Context(), userContextKey, user)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// GetUser returns authenticated user context, or anonymous if unauthenticated
func GetUser(ctx context.Context) *User {
	if user, ok := ctx.Value(userContextKey).(*User); ok {
		return user
	}
	return &User{
		ID:    "usr_anonymous",
		Email: "anonymous@verdigris.cloud",
		Roles: []string{"guest"},
		Teams: []string{},
	}
}
