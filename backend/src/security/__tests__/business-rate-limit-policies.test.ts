import { describe, expect, it } from "vitest";
import { BUSINESS_RATE_LIMIT_POLICIES } from "@backend/security/rate-limit-policies";

describe("business rate-limit policies", () => {
  it("uses per-operation, per-actor bounded policies", () => {
    expect(BUSINESS_RATE_LIMIT_POLICIES.profile_write).toEqual({ limit: 20, windowSeconds: 600 });
    expect(BUSINESS_RATE_LIMIT_POLICIES.employee_directory_read.limit)
      .toBeGreaterThan(BUSINESS_RATE_LIMIT_POLICIES.employee_invitation.limit);
    expect(BUSINESS_RATE_LIMIT_POLICIES.employee_manage.windowSeconds).toBe(3600);
    expect(BUSINESS_RATE_LIMIT_POLICIES.employee_invitation_retry.limit).toBe(20);
    expect(BUSINESS_RATE_LIMIT_POLICIES.brand_read.windowSeconds).toBe(60);
    expect(BUSINESS_RATE_LIMIT_POLICIES.brand_mutation.limit).toBe(30);
    expect(BUSINESS_RATE_LIMIT_POLICIES.avatar_upload).toEqual({
      limit: 10, windowSeconds: 600,
    });
    expect(BUSINESS_RATE_LIMIT_POLICIES.avatar_replace.limit).toBe(10);
    expect(BUSINESS_RATE_LIMIT_POLICIES.avatar_remove.limit).toBe(10);
    expect(BUSINESS_RATE_LIMIT_POLICIES.task_attachment_upload.limit).toBe(20);
    expect(BUSINESS_RATE_LIMIT_POLICIES.task_attachment_remove.limit).toBe(30);
    expect(BUSINESS_RATE_LIMIT_POLICIES.submission_attachment_upload.limit).toBe(20);
    expect(BUSINESS_RATE_LIMIT_POLICIES.submission_attachment_remove.limit).toBe(20);
    expect(BUSINESS_RATE_LIMIT_POLICIES.management_attachment_remove.limit).toBe(30);
    expect(BUSINESS_RATE_LIMIT_POLICIES.storage_signed_url.windowSeconds).toBe(60);
  });
});
