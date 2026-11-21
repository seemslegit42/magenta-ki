package appwrite

import (
	"errors"
	"fmt"
	"strings"

	"github.com/appwrite/sdk-for-go/appwrite"
	"github.com/appwrite/sdk-for-go/id"
	"github.com/appwrite/sdk-for-go/query"
)

// Table wraps an Appwrite collection/table and provides authoritative access patterns,
// strict ownership enforcement, payload sanitization, and immutability guarantees.
type Table struct {
	ID string
	db *appwrite.TablesDB
}

// NewTable returns an initialized Table accessor bound to the centralized TablesDB singleton.
func NewTable(tableID string) *Table {
	return &Table{
		ID: tableID,
		db: GetTablesDB(),
	}
}

// sanitizePayload trims all user-provided strings and converts empty optional text to nil.
func sanitizePayload(data map[string]interface{}) map[string]interface{} {
	sanitized := make(map[string]interface{}, len(data))
	for k, v := range data {
		if str, ok := v.(string); ok {
			trimmed := strings.TrimSpace(str)
			if trimmed == "" && (strings.HasSuffix(k, "optional") || strings.HasPrefix(k, "desc") || strings.Contains(k, "detail")) {
				sanitized[k] = nil
			} else {
				sanitized[k] = trimmed
			}
		} else {
			sanitized[k] = v
		}
	}
	return sanitized
}

// Create inserts a row with sanitized payload, rejecting system fields ($id, $createdAt, $updatedAt).
func (c *Table) Create(data map[string]interface{}) (map[string]interface{}, error) {
	cleanData := sanitizePayload(data)
	delete(cleanData, "$id")
	delete(cleanData, "$createdAt")
	delete(cleanData, "$updatedAt")

	doc, err := c.db.CreateRow(
		DatabaseID,
		c.ID,
		id.Unique(),
		cleanData,
	)
	if err != nil {
		return nil, fmt.Errorf("appwrite: failed to create row in table %s: %w", c.ID, err)
	}
	return doc.ToMap(), nil
}

// CreateWithPermissions inserts a row with explicit row-level permissions (e.g. role.Team, role.User).
func (c *Table) CreateWithPermissions(data map[string]interface{}, permissions []string) (map[string]interface{}, error) {
	cleanData := sanitizePayload(data)
	delete(cleanData, "$id")
	delete(cleanData, "$createdAt")
	delete(cleanData, "$updatedAt")

	doc, err := c.db.CreateRow(
		DatabaseID,
		c.ID,
		id.Unique(),
		cleanData,
		c.db.WithCreateRowPermissions(permissions),
	)
	if err != nil {
		return nil, fmt.Errorf("appwrite: failed to create row with permissions in table %s: %w", c.ID, err)
	}
	return doc.ToMap(), nil
}

// Get retrieves a single row by ID and returns its structured map.
func (c *Table) Get(rowID string) (map[string]interface{}, error) {
	if strings.TrimSpace(rowID) == "" {
		return nil, errors.New("appwrite: rowID cannot be empty")
	}

	doc, err := c.db.GetRow(DatabaseID, c.ID, rowID)
	if err != nil {
		return nil, fmt.Errorf("appwrite: failed to get row %s from table %s: %w", rowID, c.ID, err)
	}
	return doc.ToMap(), nil
}

// GetUserOwned retrieves a row and strictly verifies that createdBy matches the authenticated user ID.
func (c *Table) GetUserOwned(rowID string, userID string) (map[string]interface{}, error) {
	row, err := c.Get(rowID)
	if err != nil {
		return nil, err
	}

	createdBy, _ := row["createdBy"].(string)
	if createdBy != userID {
		return nil, fmt.Errorf("appwrite: forbidden - user %s does not own row %s", userID, rowID)
	}
	return row, nil
}

// GetTeamOwned retrieves a row and verifies that teamId matches the required team.
func (c *Table) GetTeamOwned(rowID string, teamID string) (map[string]interface{}, error) {
	row, err := c.Get(rowID)
	if err != nil {
		return nil, err
	}

	rowTeamID, _ := row["teamId"].(string)
	if rowTeamID != teamID {
		return nil, fmt.Errorf("appwrite: forbidden - team %s does not match row %s", teamID, rowID)
	}
	return row, nil
}

// ListByOwner queries rows filtered strictly by createdBy equal to userID.
func (c *Table) ListByOwner(userID string) ([]map[string]interface{}, error) {
	if strings.TrimSpace(userID) == "" {
		return nil, errors.New("appwrite: userID cannot be empty for ListByOwner")
	}

	result, err := c.db.ListRows(
		DatabaseID,
		c.ID,
		c.db.WithListRowsQueries([]string{
			query.Equal("createdBy", userID),
			query.OrderDesc("$createdAt"),
		}),
	)
	if err != nil {
		return nil, fmt.Errorf("appwrite: failed to list rows by owner %s in table %s: %w", userID, c.ID, err)
	}

	docs := make([]map[string]interface{}, len(result.Rows))
	for i, doc := range result.Rows {
		docs[i] = doc.ToMap()
	}
	return docs, nil
}

// ListByTeam queries rows filtered strictly by teamId.
func (c *Table) ListByTeam(teamID string) ([]map[string]interface{}, error) {
	if strings.TrimSpace(teamID) == "" {
		return nil, errors.New("appwrite: teamID cannot be empty for ListByTeam")
	}

	result, err := c.db.ListRows(
		DatabaseID,
		c.ID,
		c.db.WithListRowsQueries([]string{
			query.Equal("teamId", teamID),
			query.OrderDesc("$createdAt"),
		}),
	)
	if err != nil {
		return nil, fmt.Errorf("appwrite: failed to list rows by team %s in table %s: %w", teamID, c.ID, err)
	}

	docs := make([]map[string]interface{}, len(result.Rows))
	for i, doc := range result.Rows {
		docs[i] = doc.ToMap()
	}
	return docs, nil
}

// ListWithQueries executes custom queries (filters, ordering, pagination) and returns structured maps.
func (c *Table) ListWithQueries(queries []string) ([]map[string]interface{}, int, error) {
	result, err := c.db.ListRows(
		DatabaseID,
		c.ID,
		c.db.WithListRowsQueries(queries),
	)
	if err != nil {
		return nil, 0, fmt.Errorf("appwrite: query failed in table %s: %w", c.ID, err)
	}

	docs := make([]map[string]interface{}, len(result.Rows))
	for i, doc := range result.Rows {
		docs[i] = doc.ToMap()
	}
	return docs, result.Total, nil
}

// Update mutates an existing row, strictly stripping immutable columns ($id, $createdAt, $updatedAt, createdBy, teamId).
func (c *Table) Update(rowID string, data map[string]interface{}) (map[string]interface{}, error) {
	cleanData := sanitizePayload(data)
	// Enforce immutability of system and ownership columns
	delete(cleanData, "$id")
	delete(cleanData, "$createdAt")
	delete(cleanData, "$updatedAt")
	delete(cleanData, "createdBy")
	delete(cleanData, "teamId")

	doc, err := c.db.UpdateRow(DatabaseID, c.ID, rowID, cleanData)
	if err != nil {
		return nil, fmt.Errorf("appwrite: failed to update row %s in table %s: %w", rowID, c.ID, err)
	}
	return doc.ToMap(), nil
}

// UpdateUserOwned verifies ownership before updating and preserves immutable fields.
func (c *Table) UpdateUserOwned(rowID string, userID string, data map[string]interface{}) (map[string]interface{}, error) {
	if _, err := c.GetUserOwned(rowID, userID); err != nil {
		return nil, err
	}
	return c.Update(rowID, data)
}

// Delete removes a row by ID.
func (c *Table) Delete(rowID string) error {
	_, err := c.db.DeleteRow(DatabaseID, c.ID, rowID)
	if err != nil {
		return fmt.Errorf("appwrite: failed to delete row %s from table %s: %w", rowID, c.ID, err)
	}
	return nil
}

// DeleteUserOwned verifies ownership before deleting.
func (c *Table) DeleteUserOwned(rowID string, userID string) error {
	if _, err := c.GetUserOwned(rowID, userID); err != nil {
		return err
	}
	return c.Delete(rowID)
}

// Project represents a strongly typed Project entity in Appwrite TablesDB.
type Project struct {
	ID          string  `json:"$id,omitempty"`
	Name        string  `json:"name"`
	Description *string `json:"description,omitempty"`
	CreatedBy   string  `json:"createdBy"`
	TeamID      *string `json:"teamId,omitempty"`
	CreatedAt   string  `json:"$createdAt,omitempty"`
	UpdatedAt   string  `json:"$updatedAt,omitempty"`
}

// ProjectUpdateInput models updates to a Project.
// Notice that createdBy and teamId are strictly omitted to enforce immutability at compile time.
type ProjectUpdateInput struct {
	Name        *string `json:"name,omitempty"`
	Description *string `json:"description,omitempty"`
}

// ParseProject transforms an untyped document map into a strongly typed Project model.
func ParseProject(data map[string]interface{}) (*Project, error) {
	if data == nil {
		return nil, errors.New("appwrite: cannot parse nil project document")
	}

	p := &Project{}
	if id, ok := data["$id"].(string); ok {
		p.ID = id
	}
	if name, ok := data["name"].(string); ok {
		p.Name = name
	} else if title, ok := data["title"].(string); ok {
		p.Name = title
	}

	if desc, ok := data["description"].(string); ok {
		p.Description = &desc
	} else if descPtr, ok := data["description"].(*string); ok {
		p.Description = descPtr
	}

	if createdBy, ok := data["createdBy"].(string); ok {
		p.CreatedBy = createdBy
	}

	if teamID, ok := data["teamId"].(string); ok && teamID != "" {
		p.TeamID = &teamID
	} else if teamIDPtr, ok := data["teamId"].(*string); ok && teamIDPtr != nil && *teamIDPtr != "" {
		p.TeamID = teamIDPtr
	}

	if createdAt, ok := data["$createdAt"].(string); ok {
		p.CreatedAt = createdAt
	}
	if updatedAt, ok := data["$updatedAt"].(string); ok {
		p.UpdatedAt = updatedAt
	}

	return p, nil
}

// ToMap serializes the Project into an Appwrite document payload.
func (p *Project) ToMap() map[string]interface{} {
	m := make(map[string]interface{})
	if p.Name != "" {
		m["name"] = p.Name
	}
	if p.Description != nil {
		m["description"] = *p.Description
	}
	if p.CreatedBy != "" {
		m["createdBy"] = p.CreatedBy
	}
	if p.TeamID != nil && *p.TeamID != "" {
		m["teamId"] = *p.TeamID
	}
	return m
}

// ProjectRepository implements an authoritative repository pattern for projects with strict
// ownership enforcement, team listing capabilities, and field immutability guarantees.
type ProjectRepository struct {
	table *Table
}

// NewProjectRepository initializes a new ProjectRepository bound to the "projects" table.
func NewProjectRepository() *ProjectRepository {
	return &ProjectRepository{
		table: NewTable("projects"),
	}
}

// Table returns the underlying Table accessor.
func (r *ProjectRepository) Table() *Table {
	return r.table
}

// userHasTeamAccess checks if a user belongs to a specific team or has administrative privileges.
func userHasTeamAccess(userTeams []string, teamID string) bool {
	if teamID == "" {
		return false
	}
	for _, t := range userTeams {
		if t == teamID || t == "administrator" || t == "owner" {
			return true
		}
	}
	return false
}

// Create inserts a project into Appwrite, enforcing that createdBy is assigned to the authenticated user.
func (r *ProjectRepository) Create(project Project, permissions ...string) (*Project, error) {
	name := strings.TrimSpace(project.Name)
	if name == "" {
		return nil, errors.New("appwrite: project name is required")
	}
	project.Name = name

	createdBy := strings.TrimSpace(project.CreatedBy)
	if createdBy == "" {
		return nil, errors.New("appwrite: project createdBy is required for ownership enforcement")
	}
	project.CreatedBy = createdBy

	var perms []string
	if len(permissions) > 0 {
		perms = permissions
	} else {
		perms = []string{
			fmt.Sprintf("read(\"user:%s\")", project.CreatedBy),
			fmt.Sprintf("update(\"user:%s\")", project.CreatedBy),
			fmt.Sprintf("delete(\"user:%s\")", project.CreatedBy),
		}
		if project.TeamID != nil && strings.TrimSpace(*project.TeamID) != "" {
			tid := strings.TrimSpace(*project.TeamID)
			perms = append(perms,
				fmt.Sprintf("read(\"team:%s\")", tid),
				fmt.Sprintf("update(\"team:%s\")", tid),
			)
		}
	}

	payload := project.ToMap()
	doc, err := r.table.CreateWithPermissions(payload, perms)
	if err != nil {
		return nil, fmt.Errorf("appwrite: failed to create project: %w", err)
	}

	return ParseProject(doc)
}

// Get retrieves a project by its document ID.
func (r *ProjectRepository) Get(projectID string) (*Project, error) {
	doc, err := r.table.Get(projectID)
	if err != nil {
		return nil, fmt.Errorf("appwrite: failed to get project %s: %w", projectID, err)
	}
	return ParseProject(doc)
}

// GetWithOwnership retrieves a project and verifies that the requesting user owns it
// or belongs to the project's assigned team.
func (r *ProjectRepository) GetWithOwnership(projectID string, userID string, userTeams []string) (*Project, error) {
	project, err := r.Get(projectID)
	if err != nil {
		return nil, err
	}

	isOwner := project.CreatedBy == userID
	isTeamMember := project.TeamID != nil && userHasTeamAccess(userTeams, *project.TeamID)

	if !isOwner && !isTeamMember {
		return nil, fmt.Errorf("appwrite: forbidden - user %s is not authorized to access project %s", userID, projectID)
	}

	return project, nil
}

// ListByOwner retrieves all projects created by a specific user.
func (r *ProjectRepository) ListByOwner(userID string) ([]Project, error) {
	if strings.TrimSpace(userID) == "" {
		return nil, errors.New("appwrite: userID cannot be empty for ListByOwner")
	}

	docs, err := r.table.ListByOwner(userID)
	if err != nil {
		return nil, fmt.Errorf("appwrite: failed to list projects by owner %s: %w", userID, err)
	}

	projects := make([]Project, 0, len(docs))
	for _, doc := range docs {
		if p, err := ParseProject(doc); err == nil {
			projects = append(projects, *p)
		}
	}
	return projects, nil
}

// ListByTeam retrieves all projects scoped to a specific team ID.
func (r *ProjectRepository) ListByTeam(teamID string) ([]Project, error) {
	trimmedTeam := strings.TrimSpace(teamID)
	if trimmedTeam == "" {
		return nil, errors.New("appwrite: teamID cannot be empty for ListByTeam")
	}

	docs, err := r.table.ListByTeam(trimmedTeam)
	if err != nil {
		return nil, fmt.Errorf("appwrite: failed to list projects by team %s: %w", trimmedTeam, err)
	}

	projects := make([]Project, 0, len(docs))
	for _, doc := range docs {
		if p, err := ParseProject(doc); err == nil {
			projects = append(projects, *p)
		}
	}
	return projects, nil
}

// ListByTeamWithMembership checks if the user is a member of the target team before querying.
func (r *ProjectRepository) ListByTeamWithMembership(teamID string, userTeams []string) ([]Project, error) {
	trimmedTeam := strings.TrimSpace(teamID)
	if trimmedTeam == "" {
		return nil, errors.New("appwrite: teamID cannot be empty for ListByTeamWithMembership")
	}

	if !userHasTeamAccess(userTeams, trimmedTeam) {
		return nil, fmt.Errorf("appwrite: forbidden - user is not a member of team %s", trimmedTeam)
	}

	return r.ListByTeam(trimmedTeam)
}

// Update mutates an existing project, ensuring that createdBy and teamId remain strictly immutable.
func (r *ProjectRepository) Update(projectID string, userID string, updates map[string]interface{}, userTeams []string) (*Project, error) {
	if strings.TrimSpace(projectID) == "" {
		return nil, errors.New("appwrite: projectID cannot be empty")
	}

	// 1. Fetch existing project to verify authorization and ownership
	existing, err := r.Get(projectID)
	if err != nil {
		return nil, fmt.Errorf("appwrite: project %s not found for update: %w", projectID, err)
	}

	// 2. Ownership enforcement: must be the creator or an authorized team member
	isOwner := existing.CreatedBy == userID
	isTeamMember := existing.TeamID != nil && userHasTeamAccess(userTeams, *existing.TeamID)
	if !isOwner && !isTeamMember {
		return nil, fmt.Errorf("appwrite: forbidden - user %s is not authorized to update project %s", userID, projectID)
	}

	// 3. Strict Immutability Enforcement: reject any attempt to alter createdBy or teamId
	if attemptedCreatedBy, exists := updates["createdBy"]; exists {
		if cbStr, ok := attemptedCreatedBy.(string); ok && cbStr != existing.CreatedBy {
			return nil, fmt.Errorf("appwrite: validation error - createdBy is immutable and cannot be updated from %s to %s", existing.CreatedBy, cbStr)
		}
	}
	if attemptedTeamID, exists := updates["teamId"]; exists {
		existingTeam := ""
		if existing.TeamID != nil {
			existingTeam = *existing.TeamID
		}
		if tidStr, ok := attemptedTeamID.(string); ok && tidStr != existingTeam {
			return nil, fmt.Errorf("appwrite: validation error - teamId is immutable and cannot be updated from %s to %s", existingTeam, tidStr)
		}
	}

	// 4. Sanitize and remove all immutable fields and system metadata from payload
	cleanUpdates := sanitizePayload(updates)
	delete(cleanUpdates, "createdBy")
	delete(cleanUpdates, "teamId")
	delete(cleanUpdates, "$id")
	delete(cleanUpdates, "$createdAt")
	delete(cleanUpdates, "$updatedAt")

	if len(cleanUpdates) == 0 {
		return existing, nil
	}

	// 5. Update row in TablesDB
	updatedDoc, err := r.table.Update(projectID, cleanUpdates)
	if err != nil {
		return nil, fmt.Errorf("appwrite: failed to update project %s: %w", projectID, err)
	}

	return ParseProject(updatedDoc)
}

// UpdateTyped performs a type-safe update using ProjectUpdateInput where immutable fields cannot even be specified.
func (r *ProjectRepository) UpdateTyped(projectID string, userID string, input ProjectUpdateInput, userTeams []string) (*Project, error) {
	updates := make(map[string]interface{})
	if input.Name != nil {
		updates["name"] = *input.Name
	}
	if input.Description != nil {
		updates["description"] = *input.Description
	}
	return r.Update(projectID, userID, updates, userTeams)
}

// Delete removes a project after validating that the user owns it or belongs to the project team.
func (r *ProjectRepository) Delete(projectID string, userID string, userTeams []string) error {
	if strings.TrimSpace(projectID) == "" {
		return errors.New("appwrite: projectID cannot be empty")
	}

	existing, err := r.Get(projectID)
	if err != nil {
		return fmt.Errorf("appwrite: project %s not found for deletion: %w", projectID, err)
	}

	isOwner := existing.CreatedBy == userID
	isTeamMember := existing.TeamID != nil && userHasTeamAccess(userTeams, *existing.TeamID)
	if !isOwner && !isTeamMember {
		return fmt.Errorf("appwrite: forbidden - user %s is not authorized to delete project %s", userID, projectID)
	}

	return r.table.Delete(projectID)
}

// Exported standard tables and repositories configured for authoritative access
var (
	Items          = NewTable("items")
	Projects       = NewProjectRepository()
	ProjectsRepo   = Projects
	Todos          = NewTable("todos")
	XiTransactions = NewTable("xi_transactions")
	XiBalances     = NewTable("xi_balances")
	XiProposals    = NewTable("xi_proposals")
)
