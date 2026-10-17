package appwrite

import (
	"github.com/appwrite/sdk-for-go/appwrite"
	"github.com/appwrite/sdk-for-go/id"
	"github.com/appwrite/sdk-for-go/query"
)

type Table struct {
	ID string
	db *appwrite.TablesDB
}

func NewTable(tableID string) *Table {
	return &Table{
		ID: tableID,
		db: GetTablesDB(),
	}
}

func (c *Table) Create(data map[string]interface{}) (map[string]interface{}, error) {
	doc, err := c.db.CreateRow(
		DatabaseID,
		c.ID,
		id.Unique(),
		data,
	)
	if err != nil {
		return nil, err
	}
	return doc.ToMap(), nil
}

func (c *Table) Get(rowID string) (map[string]interface{}, error) {
	doc, err := c.db.GetRow(DatabaseID, c.ID, rowID)
	if err != nil {
		return nil, err
	}
	return doc.ToMap(), nil
}

func (c *Table) ListByOwner(userID string) ([]map[string]interface{}, error) {
	result, err := c.db.ListRows(
		DatabaseID,
		c.ID,
		c.db.WithListRowsQueries([]string{
			query.Equal("createdBy", userID),
			query.OrderDesc("$createdAt"),
		}),
	)
	if err != nil {
		return nil, err
	}

	docs := make([]map[string]interface{}, len(result.Rows))
	for i, doc := range result.Rows {
		docs[i] = doc.ToMap()
	}
	return docs, nil
}

func (c *Table) ListByTeam(teamID string) ([]map[string]interface{}, error) {
	result, err := c.db.ListRows(
		DatabaseID,
		c.ID,
		c.db.WithListRowsQueries([]string{
			query.Equal("teamId", teamID),
			query.OrderDesc("$createdAt"),
		}),
	)
	if err != nil {
		return nil, err
	}

	docs := make([]map[string]interface{}, len(result.Rows))
	for i, doc := range result.Rows {
		docs[i] = doc.ToMap()
	}
	return docs, nil
}

func (c *Table) Update(rowID string, data map[string]interface{}) (map[string]interface{}, error) {
	// Enforce immutability of system and ownership columns
	delete(data, "$id")
	delete(data, "$createdAt")
	delete(data, "$updatedAt")
	delete(data, "createdBy")
	delete(data, "teamId")

	doc, err := c.db.UpdateRow(DatabaseID, c.ID, rowID, data)
	if err != nil {
		return nil, err
	}
	return doc.ToMap(), nil
}

func (c *Table) Delete(rowID string) error {
	_, err := c.db.DeleteRow(DatabaseID, c.ID, rowID)
	return err
}

// Exported standard tables
var (
	Items          = NewTable("items")
	Projects       = NewTable("projects")
	Todos          = NewTable("todos")
	XiTransactions = NewTable("xi_transactions")
	XiBalances     = NewTable("xi_balances")
	XiProposals    = NewTable("xi_proposals")
)
