import re, os

fixes = [
  ('app/audit-logs/activity-logs/page.tsx', 2),
  ('app/audit-logs/export-reports/page.tsx', 2),
  ('app/audit-logs/transaction-trail/page.tsx', 2),
  ('app/authentication/login-attempts/page.tsx', 2),
  ('app/authentication/mfa-settings/page.tsx', 2),
  ('app/authentication/session-settings/page.tsx', 2),
  ('app/my-profile/page.tsx', 2),
  ('app/permissions/module-access/page.tsx', 2),
  ('app/permissions/permission-matrix/page.tsx', 2),
  ('app/role-management/all-roles/page.tsx', 2),
  ('app/role-management/assign-role/page.tsx', 2),
  ('app/role-management/role-hierarchy/page.tsx', 2),
  ('app/security-monitoring/device-tracking/page.tsx', 2),
  ('app/security-monitoring/failed-logins/page.tsx', 2),
  ('app/security-monitoring/live-alerts/page.tsx', 2),
  ('app/security-monitoring/suspicious-activity/page.tsx', 2),
  ('app/users-accounts/access-requests/page.tsx', 2),
  ('app/users-accounts/deactivate-user/page.tsx', 2),
  ('app/users-accounts/user-accounts/page.tsx', 2),
]

for file, count in fixes:
  if not os.path.exists(file):
    print('SKIP:', file)
    continue
  c = open(file, encoding='utf8').read()

  # Find </DashboardLayout> and remove `count` </div> tags immediately before it
  for _ in range(count):
    c = re.sub(r'(\s*</div>)(\s*</DashboardLayout>)', r'\2', c, count=1)

  open(file, 'w', encoding='utf8').write(c)
  print('Fixed:', file)

print('All done!')
