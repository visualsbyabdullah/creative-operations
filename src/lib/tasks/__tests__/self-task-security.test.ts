import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const migration = readFileSync(join(root,
  "supabase/migrations/202608090003_employee_self_tasks.sql"), "utf8");
const brandOptionsMigration = readFileSync(join(root,
  "supabase/migrations/202608090005_employee_self_task_brand_options.sql"), "utf8");
const brandCreationMigration = readFileSync(join(root,
  "supabase/migrations/202608130001_employee_self_task_brand_creation.sql"), "utf8");
const service = readFileSync(join(root, "src/lib/tasks/task-service.ts"), "utf8");
const page = readFileSync(join(root, "src/app/tasks/page.tsx"), "utf8");
const component = readFileSync(join(root, "src/components/tasks/MyTasks.tsx"), "utf8");
const calendar = readFileSync(join(root, "src/components/ui/CalendarDatePill.tsx"), "utf8");
const completionMigration = readFileSync(join(root,
  "supabase/migrations/202608140001_employee_complete_self_task.sql"), "utf8");

describe("employee self-task security contract", () => {
  it("derives creator and assignee from the authenticated employee", () => {
    expect(migration).toContain("v_actor uuid := private.current_active_profile_id()");
    expect(migration).toContain("v_workspace, v_task_id, v_actor, v_actor");
    expect(migration).toContain("v_actor, v_actor\n  ) returning id");
  });

  it("permits only active creative employee roles", () => {
    expect(migration).toContain("v_role not in ('graphic_designer', 'video_editor')");
    expect(service).toContain('["graphic_designer", "video_editor"].includes(actor.profile.role)');
  });

  it("does not accept creator, assignee, workspace, or status input", () => {
    const signature = migration.slice(
      migration.indexOf("create or replace function public.create_self_task_v1"),
      migration.indexOf(")\nreturns uuid"),
    );
    expect(signature).not.toMatch(/assignee|creator|workspace|status/iu);
    expect(service).toContain('new Set(["brandId", "title", "scheduledDate", "priority", "description"])');
  });

  it("uses the canonical assigned workflow and audit trail", () => {
    expect(migration).toContain("null, 'assigned', p_priority");
    expect(migration).toContain("private.append_business_audit_event");
  });

  it("keeps self-tasks visible to authorized management queries", () => {
    expect(migration).toContain("private.is_management() or private.is_task_assignee(t.id)");
    expect(migration).toContain("then 'self_created' else 'management_assigned'");
  });

  it("scopes brand options to active brands in the employee workspace", () => {
    expect(brandOptionsMigration).toContain("b.workspace_id = v_workspace and b.status = 'active'");
    expect(brandOptionsMigration).toContain("p.role in ('graphic_designer', 'video_editor')");
    expect(brandOptionsMigration).toContain("private.current_active_profile_id()");
  });

  it("allows active creative employees to create only a minimal workspace brand", () => {
    expect(brandCreationMigration).toContain("p.role in ('graphic_designer', 'video_editor')");
    expect(brandCreationMigration).toContain("values (v_workspace, pg_catalog.btrim(p_name), pg_catalog.btrim(p_industry))");
    expect(brandCreationMigration).toContain("revoke all on function public.create_self_task_brand_v1");
    expect(brandCreationMigration).toContain("private.append_business_audit_event");
    expect(service).toContain('Object.keys(item).some((key) => !["name", "industry"].includes(key))');
  });

  it("shows all assigned tasks while preserving selected-date progress", () => {
    expect(page).toContain("listTasks()");
    expect(component).toContain("task.scheduledDate === selectedDate");
    expect(component).toContain("/tasks?date=${date}");
    expect(calendar).toContain('role="dialog"');
    expect(calendar).not.toContain('type="date"');
  });

  it("allows direct completion only for an assignee's personal self-task", () => {
    expect(completionMigration).toContain("private.is_task_assignee(p_task_id)");
    expect(completionMigration).toContain("v_task.created_by = v_actor and v_task.content_type = 'Personal Task'");
    expect(completionMigration).toContain("private.append_business_audit_event");
  });

  it("does not expose an assignee selector in the employee task dialog", () => {
    const dialog = component.slice(component.indexOf('aria-labelledby="add-task-title"'));
    expect(dialog).not.toContain("Assignee");
    expect(dialog).not.toContain("assigned_to");
  });
});
