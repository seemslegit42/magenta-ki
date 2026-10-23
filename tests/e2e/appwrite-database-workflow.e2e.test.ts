import { describe, it, expect } from 'bun:test';
import { AppwriteDatabaseService } from '../../ts/apps/host/app/services/appwrite-database.service';
import { WindowManagerService } from '../../ts/apps/host/app/services/window-manager.service';
import { AuthRbacService } from '../../ts/apps/host/app/services/auth-rbac.service';
import { AuditService } from '../../ts/apps/host/app/services/audit.service';
import { NotificationService } from '../../ts/apps/host/app/services/notification.service';

describe('E2E: Appwrite Databases & Server SDK Workflow', () => {
  it('should provision databases, manage schema tables, generate SDK snippets, and enforce RBAC and audit telemetry', async () => {
    // 1. Initialize Microkernel Services
    const auth = new AuthRbacService();
    const audit = new AuditService();
    audit.setAuthRbacForTesting(auth);
    const notifications = new NotificationService();
    const windowMgr = new WindowManagerService();

    const dbService = new AppwriteDatabaseService();
    dbService.setDependenciesForTesting(audit, notifications, auth);

    // 2. Launch Appwrite Databases in Window Manager
    const pid = windowMgr.spawnProcess(
      'appwrite-db',
      'Appwrite Databases & SDK',
      'dataset',
      'AppwriteDatabasesComponent',
      'system'
    );
    expect(pid.startsWith('proc_')).toBe(true);
    expect(windowMgr.activeProcesses().some(p => p.pid === pid)).toBe(true);

    // 3. Verify Default Enterprise Databases
    const initialDatabases = dbService.allDatabases();
    expect(initialDatabases.length).toBeGreaterThanOrEqual(4);
    expect(dbService.sharedCount()).toBeGreaterThan(0);
    expect(dbService.dedicatedCount()).toBeGreaterThan(0);

    const initialAuditCount = audit.totalCount();

    // 4. Administrator Provisions a New Dedicated Database
    auth.switchRole('administrator');
    expect(auth.hasPermission('database:create')).toBe(true);

    const dedicatedDb = dbService.createDatabase({
      id: 'iot_edge_mesh_dedicated',
      name: 'Industrial IoT Telemetry',
      infrastructure: 'dedicated',
      description: 'Dedicated high-frequency sensor ingestion cluster.',
      initialTables: [
        { name: 'vibrations', columnsCount: 5 },
        { name: 'temperatures', columnsCount: 4 }
      ]
    });

    expect(dedicatedDb.id).toBe('iot_edge_mesh_dedicated');
    expect(dedicatedDb.infrastructure).toBe('dedicated');
    expect(dedicatedDb.tables.length).toBe(2);

    // Verify Audit Event
    const createDbAudit = audit.allLogs()[0];
    expect(createDbAudit.action).toBe('APPWRITE_DATABASE_CREATED');
    expect(createDbAudit.targetEntity).toBe('iot_edge_mesh_dedicated');
    expect(createDbAudit.status).toBe('success');

    // Verify Notification Alert
    const latestNotif = notifications.allNotifications()[0];
    expect(latestNotif.title).toContain('Appwrite Database Created');
    expect(latestNotif.category).toBe('database');
    expect(latestNotif.priority).toBe('high');

    // 5. Create a Schema Table with Typed Attributes
    const table = dbService.createTable('iot_edge_mesh_dedicated', {
      id: 'tbl_pressure_metrics',
      name: 'pressure_metrics',
      columns: [
        { key: 'sensor_id', type: 'string', required: true },
        { key: 'psi_value', type: 'float', required: true },
        { key: 'is_critical', type: 'boolean', required: false, defaultValue: false },
        { key: 'recorded_at', type: 'datetime', required: true }
      ]
    });

    expect(table.id).toBe('tbl_pressure_metrics');
    expect(table.columnsCount).toBe(4);

    const updatedDb = dbService.getDatabase('iot_edge_mesh_dedicated');
    expect(updatedDb?.tables.length).toBe(3);

    const tableAudit = audit.allLogs()[0];
    expect(tableAudit.action).toBe('APPWRITE_TABLE_CREATED');

    // 6. RBAC Boundary Enforcement: Switch to General User
    auth.switchRole('general_user');
    expect(auth.currentRole()).toBe('general_user');
    expect(auth.hasPermission('database:manage')).toBe(false);

    // Unauthorized deletion attempt should throw and log security audit
    expect(() => {
      dbService.deleteDatabase('iot_edge_mesh_dedicated');
    }).toThrow('Only administrators can delete Appwrite databases.');

    const blockedAudit = audit.allLogs()[0];
    expect(blockedAudit.action).toBe('APPWRITE_DB_DELETE_BLOCKED');
    expect(blockedAudit.status).toBe('blocked');
    expect(blockedAudit.severity).toBe('security');

    // 7. Server SDK Code Generation Across Multiple Languages
    const sdkParams = {
      endpoint: 'https://edge.appwrite.io/v1',
      projectId: 'verdigris-production',
      apiKey: 'sec_prod_key_7788',
      databaseId: 'iot_edge_mesh_dedicated',
      name: 'Industrial IoT Telemetry'
    };

    const nodeSnippet = dbService.generateServerSdkSnippet('nodejs', sdkParams);
    expect(nodeSnippet).toContain("const sdk = require('node-appwrite');");
    expect(nodeSnippet).toContain("databaseId: 'iot_edge_mesh_dedicated'");
    expect(nodeSnippet).toContain("tablesDB.create");

    const rustSnippet = dbService.generateServerSdkSnippet('rust', sdkParams);
    expect(rustSnippet).toContain('use appwrite::services::databases::Databases;');
    expect(rustSnippet).toContain('iot_edge_mesh_dedicated');

    const pythonSnippet = dbService.generateServerSdkSnippet('python', sdkParams);
    expect(pythonSnippet).toContain('tablesDB.create');

    // 8. Execute Sandbox SDK Call Simulation
    const sdkExecution = await dbService.simulateSdkExecution('rust', sdkParams);
    expect(sdkExecution.success).toBe(true);
    expect(sdkExecution.latencyMs).toBeGreaterThan(0);
    expect(sdkExecution.response.$id).toBe('iot_edge_mesh_dedicated');
    expect(sdkExecution.stdoutLogs.some(l => l.includes('HTTP 201'))).toBe(true);

    const sdkAudit = audit.allLogs()[0];
    expect(sdkAudit.action).toBe('APPWRITE_SDK_INVOKED');

    // 9. Administrator Cleanup
    auth.switchRole('administrator');
    const deleteSuccess = dbService.deleteDatabase('iot_edge_mesh_dedicated');
    expect(deleteSuccess).toBe(true);
    expect(dbService.getDatabase('iot_edge_mesh_dedicated')).toBeUndefined();

    // 10. Close Window
    windowMgr.terminateProcess(pid);
    expect(windowMgr.activeProcesses().some(p => p.pid === pid)).toBe(false);

    // Total audit events should have recorded all lifecycle actions
    expect(audit.totalCount()).toBeGreaterThan(initialAuditCount + 4);
  });
});
