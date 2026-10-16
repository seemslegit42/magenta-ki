import { describe, it, expect, beforeEach } from 'bun:test';
import { AppwriteDatabaseService } from '../../src/app/services/appwrite-database.service';
import { AuditService } from '../../src/app/services/audit.service';
import { NotificationService } from '../../src/app/services/notification.service';
import { AuthRbacService } from '../../src/app/services/auth-rbac.service';

describe('AppwriteDatabaseService', () => {
  let dbService: AppwriteDatabaseService;
  let auditService: AuditService;
  let notifService: NotificationService;
  let authService: AuthRbacService;

  beforeEach(() => {
    authService = new AuthRbacService();
    auditService = new AuditService();
    auditService.setAuthRbacForTesting(authService);
    notifService = new NotificationService();

    dbService = new AppwriteDatabaseService();
    dbService.setDependenciesForTesting(auditService, notifService, authService);
  });

  it('should initialize with default enterprise databases and tables', () => {
    const dbs = dbService.allDatabases();
    expect(dbs.length).toBeGreaterThanOrEqual(4);
    expect(dbService.databaseCount()).toBe(dbs.length);
    expect(dbService.sharedCount()).toBeGreaterThan(0);
    expect(dbService.dedicatedCount()).toBeGreaterThan(0);
    expect(dbService.totalTables()).toBeGreaterThan(5);
    expect(dbService.totalRecords()).toBeGreaterThan(10000);

    const coreDb = dbService.getDatabase('db_enterprise_core');
    expect(coreDb).toBeDefined();
    expect(coreDb?.tables.some(t => t.name === 'users')).toBe(true);
  });

  it('should create a new shared database when user has database:create permission', () => {
    authService.switchRole('administrator');
    const initialCount = dbService.databaseCount();

    const created = dbService.createDatabase({
      id: 'custom_microservices_db',
      name: 'Microservices Mesh DB',
      infrastructure: 'shared',
      description: 'Test database for federated services',
      initialTables: [
        { name: 'services', columnsCount: 4 },
        { name: 'routes', columnsCount: 3 }
      ]
    });

    expect(created.id).toBe('custom_microservices_db');
    expect(created.name).toBe('Microservices Mesh DB');
    expect(created.infrastructure).toBe('shared');
    expect(created.tables.length).toBe(2);
    expect(dbService.databaseCount()).toBe(initialCount + 1);

    // Verify audit log
    const recentAudit = auditService.allLogs()[0];
    expect(recentAudit.action).toBe('APPWRITE_DATABASE_CREATED');
    expect(recentAudit.targetEntity).toBe('custom_microservices_db');
  });

  it('should create a dedicated high-performance database with custom attributes', () => {
    authService.switchRole('administrator');
    const created = dbService.createDatabase({
      name: 'High-Throughput Timeseries',
      infrastructure: 'dedicated',
      description: 'Dedicated isolated DB'
    });

    expect(created.infrastructure).toBe('dedicated');
    expect(created.region).toContain('dedicated');
  });

  it('should prevent general_user without database:create permission from creating database', () => {
    authService.switchRole('general_user');

    expect(() => {
      dbService.createDatabase({
        name: 'Forbidden DB',
        infrastructure: 'shared'
      });
    }).toThrow('restricted for role');

    // Audit trail should record blocked event
    const blockedLog = auditService.allLogs().find(l => l.action === 'APPWRITE_DB_CREATE_BLOCKED');
    expect(blockedLog).toBeDefined();
    expect(blockedLog?.status).toBe('blocked');
  });

  it('should generate valid Server SDK code snippets for all supported languages', () => {
    const config = {
      endpoint: 'https://cloud.appwrite.io/v1',
      projectId: 'verdigris-cloud-os',
      apiKey: 'test-secret-key-12345',
      databaseId: 'test_db_id',
      name: 'Test Database Name'
    };

    // Node.js
    const nodeCode = dbService.generateServerSdkSnippet('nodejs', config);
    expect(nodeCode).toContain("require('node-appwrite')");
    expect(nodeCode).toContain("setEndpoint('https://cloud.appwrite.io/v1')");
    expect(nodeCode).toContain("setProject('verdigris-cloud-os')");
    expect(nodeCode).toContain("databaseId: 'test_db_id'");

    // Python
    const pyCode = dbService.generateServerSdkSnippet('python', config);
    expect(pyCode).toContain('from appwrite.services.tables_db import TablesDB');
    expect(pyCode).toContain("database_id='test_db_id'");

    // Rust
    const rustCode = dbService.generateServerSdkSnippet('rust', config);
    expect(rustCode).toContain('use appwrite::services::databases::Databases;');
    expect(rustCode).toContain('test_db_id');

    // Deno
    const denoCode = dbService.generateServerSdkSnippet('deno', config);
    expect(denoCode).toContain('npm:node-appwrite');

    // PHP
    const phpCode = dbService.generateServerSdkSnippet('php', config);
    expect(phpCode).toContain('Appwrite\\Services\\TablesDB');

    // C#
    const csharpCode = dbService.generateServerSdkSnippet('csharp', config);
    expect(csharpCode).toContain('using Appwrite.Services;');

    // Swift
    const swiftCode = dbService.generateServerSdkSnippet('swift', config);
    expect(swiftCode).toContain('TablesDB(client)');

    // Kotlin
    const kotlinCode = dbService.generateServerSdkSnippet('kotlin', config);
    expect(kotlinCode).toContain('io.appwrite.services.TablesDB');

    // Dart
    const dartCode = dbService.generateServerSdkSnippet('dart', config);
    expect(dartCode).toContain('dart_appwrite');
  });

  it('should execute simulated SDK call and capture execution output and latency', async () => {
    const config = {
      endpoint: 'https://cloud.appwrite.io/v1',
      projectId: 'verdigris-cloud-os',
      apiKey: 'sec_key_xyz',
      databaseId: 'simulated_mesh_db',
      name: 'Simulated Mesh'
    };

    const res = await dbService.simulateSdkExecution('nodejs', config);
    expect(res.success).toBe(true);
    expect(res.latencyMs).toBeGreaterThan(0);
    expect(res.response.$id).toBe('simulated_mesh_db');
    expect(res.response.name).toBe('Simulated Mesh');
    expect(res.stdoutLogs.length).toBeGreaterThanOrEqual(4);

    const auditLog = auditService.allLogs()[0];
    expect(auditLog.action).toBe('APPWRITE_SDK_INVOKED');
  });

  it('should create and delete tables within a database with RBAC verification', () => {
    authService.switchRole('administrator');
    const table = dbService.createTable('db_enterprise_core', {
      name: 'api_keys',
      columns: [
        { key: 'key_id', type: 'string', required: true },
        { key: 'secret_hash', type: 'string', required: true },
        { key: 'created_at', type: 'datetime', required: true }
      ]
    });

    expect(table.name).toBe('api_keys');
    expect(table.columnsCount).toBe(3);

    const db = dbService.getDatabase('db_enterprise_core');
    expect(db?.tables.some(t => t.id === table.id)).toBe(true);

    // Delete table as administrator
    const deleted = dbService.deleteTable('db_enterprise_core', table.id);
    expect(deleted).toBe(true);

    const updatedDb = dbService.getDatabase('db_enterprise_core');
    expect(updatedDb?.tables.some(t => t.id === table.id)).toBe(false);
  });

  it('should allow administrator to delete a database and purge all tables', () => {
    authService.switchRole('administrator');
    const initialCount = dbService.databaseCount();

    // Create a temporary database to delete
    const tempDb = dbService.createDatabase({
      id: 'db_to_delete',
      name: 'Temp Deletable DB',
      infrastructure: 'shared'
    });
    expect(dbService.databaseCount()).toBe(initialCount + 1);

    const success = dbService.deleteDatabase(tempDb.id);
    expect(success).toBe(true);
    expect(dbService.databaseCount()).toBe(initialCount);
    expect(dbService.getDatabase(tempDb.id)).toBeUndefined();
  });

  it('should reject non-administrator attempting to delete a database', () => {
    authService.switchRole('content_creator');

    expect(() => {
      dbService.deleteDatabase('db_enterprise_core');
    }).toThrow('Only administrators can delete Appwrite databases.');
  });

  it('should insert records into a table and update row counts', () => {
    authService.switchRole('content_creator');
    const db = dbService.getDatabase('db_enterprise_core')!;
    const initialRecords = db.tables.find(t => t.id === 'tbl_users')!.recordsCount;

    const inserted = dbService.insertRecord('db_enterprise_core', 'tbl_users', {
      user_id: 'usr_new_99',
      email: 'alex.vance@verdigris.cloud',
      role: 'content_creator',
      status: 'active'
    });

    expect(inserted.$id).toBeDefined();
    expect(inserted.$createdAt).toBeDefined();
    expect(inserted['email']).toBe('alex.vance@verdigris.cloud');

    const updatedDb = dbService.getDatabase('db_enterprise_core')!;
    const updatedUsersTable = updatedDb.tables.find(t => t.id === 'tbl_users')!;
    expect(updatedUsersTable.recordsCount).toBe(initialRecords + 1);
    expect(updatedUsersTable.sampleRecords?.some(r => r['email'] === 'alex.vance@verdigris.cloud')).toBe(true);

    const auditEvent = auditService.allLogs()[0];
    expect(auditEvent.action).toBe('APPWRITE_RECORD_INSERTED');
  });

  it('should prevent general user from inserting records without permission', () => {
    authService.switchRole('general_user');

    expect(() => {
      dbService.insertRecord('db_enterprise_core', 'tbl_users', {
        user_id: 'usr_unauthorized'
      });
    }).toThrow('restricted for role');

    const blockedLog = auditService.allLogs()[0];
    expect(blockedLog.action).toBe('APPWRITE_RECORD_INSERT_BLOCKED');
    expect(blockedLog.status).toBe('blocked');
  });
});
