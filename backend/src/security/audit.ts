import "server-only";

import { randomUUID } from "node:crypto";

import { invokeSecurityRpc } from "@backend/supabase/admin";
import {
  sanitizeAuditMetadata,
  type AuthAuditEventType,
  type AuthAuditResult,
} from "@backend/security/audit-metadata";
import type { RequestSecurityContext } from "@backend/security/request-context";

type AuditInput = {
  eventType: AuthAuditEventType;
  result: AuthAuditResult;
  context: RequestSecurityContext;
  actorUserId?: string;
  targetUserId?: string;
  workspaceId?: string;
  metadata?: Record<string, unknown>;
};

export async function appendAuthAuditEvent(
  input: AuditInput,
) {
  let metadata: Record<string, string | number>;

  try {
    metadata = sanitizeAuditMetadata(
      input.eventType,
      input.metadata,
    );
  } catch {
    return false;
  }

  const result = await invokeSecurityRpc<boolean>(
    "append_auth_audit_event",
    {
      p_event_id: randomUUID(),
      p_event_type: input.eventType,
      p_result: input.result,
      p_actor_user_id: input.actorUserId ?? null,
      p_target_user_id: input.targetUserId ?? null,
      p_workspace_id: input.workspaceId ?? null,
      p_request_id: input.context.requestId,
      p_ip_identifier: `\\x${input.context.ipIdentifier}`,
      p_user_agent_identifier: `\\x${input.context.userAgentIdentifier}`,
      p_source: input.context.source,
      p_metadata: metadata,
    },
  );

  if (!result.ok) {
    console.error("Authentication audit write unavailable.", {
      requestId: input.context.requestId,
      eventType: input.eventType,
    });
    return false;
  }

  return true;
}
