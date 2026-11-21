package middleware

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestUserHasTeamAndRole(t *testing.T) {
	member := &User{
		ID:    "usr_member",
		Roles: []string{"developer"},
		Teams: []string{"team_alpha"},
	}

	if !member.HasTeam("team_alpha") {
		t.Error("expected member to belong to team_alpha")
	}
	if member.HasTeam("team_other") {
		t.Error("expected member not to belong to team_other")
	}
	if member.HasTeam("") {
		t.Error("expected empty teamID to return false")
	}
	if !member.HasRole("developer") || member.HasRole("administrator") {
		t.Error("unexpected role evaluation for developer")
	}

	admin := &User{
		ID:    "usr_admin",
		Roles: []string{"administrator"},
		Teams: []string{},
	}
	if !admin.HasTeam("team_any") {
		t.Error("expected administrator role to have implicit team access")
	}
}

func TestAuthMiddlewareExtractsBearerToken(t *testing.T) {
	var capturedUser *User
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedUser = GetUser(r.Context())
		w.WriteHeader(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/api/projects", nil)
	req.Header.Set("Authorization", "Bearer usr_alice_42")
	rec := httptest.NewRecorder()

	AuthMiddleware(next).ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	if capturedUser == nil || capturedUser.ID != "usr_alice_42" {
		t.Fatalf("expected extracted user usr_alice_42, got %+v", capturedUser)
	}
}

func TestGetUserFallbackAnonymous(t *testing.T) {
	user := GetUser(context.Background())
	if user.ID != "usr_anonymous" {
		t.Errorf("expected usr_anonymous fallback, got %s", user.ID)
	}
}
