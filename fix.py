import re, os

fixes = [
  ('app/audit-logs/activity-logs/page.tsx','Activity Logs','activity-logs','al-root','al-content','main-content'),
  ('app/audit-logs/export-reports/page.tsx','Export Reports','export-reports','er-root','er-main','er-scroll'),
  ('app/audit-logs/transaction-trail/page.tsx','Transaction Trail','transaction-trail','tt-root','tt-main','tt-scroll'),
  ('app/authentication/login-attempts/page.tsx','Login Attempts','login-attempts','la-root','la-main','la-scroll'),
  ('app/authentication/mfa-settings/page.tsx','MFA Settings','mfa-settings','mfa-root','mfa-main','mfa-scroll'),
  ('app/authentication/session-settings/page.tsx','Session Settings','session-settings','ss-root','ss-main','ss-scroll'),
  ('app/my-profile/page.tsx','My Profile','my-profile','pr-root','pr-main','pr-scroll'),
  ('app/permissions/module-access/page.tsx','Module Access','module-access','ma-root','ma-main','ma-scroll'),
  ('app/permissions/permission-matrix/page.tsx','Permission Matrix','permission-matrix','pm-root','pm-main','pm-scroll'),
  ('app/role-management/all-roles/page.tsx','Role Management','all-roles','ar-root','ar-main','ar-scroll'),
  ('app/role-management/assign-role/page.tsx','Role Management','assign-role','asr-root','asr-main','asr-scroll'),
  ('app/role-management/role-hierarchy/page.tsx','Role Management','role-hierarchy','rh-root','rh-main','main-content'),
  ('app/security-monitoring/device-tracking/page.tsx','Security Monitoring','device-tracking','dt-root','dt-main','dt-scroll'),
  ('app/security-monitoring/failed-logins/page.tsx','Security Monitoring','failed-logins','fl-root','fl-main','fl-scroll'),
  ('app/security-monitoring/live-alerts/page.tsx','Security Monitoring','live-alerts','la-root','la-main','la-scroll'),
  ('app/security-monitoring/suspicious-activity/page.tsx','Security Monitoring','suspicious-activity','sa-root','sa-main','sa-scroll'),
  ('app/users-accounts/access-requests/page.tsx','Access Requests','access-requests','ar-root','ar-main','ar-scroll'),
  ('app/users-accounts/deactivate-user/page.tsx','Deactivate User','deactivate-user','du-root','du-main','du-scroll'),
  ('app/users-accounts/user-accounts/page.tsx','Users & Accounts','user-accounts','ua-root','ua-main','ua-scroll'),
]

for file,title,menu,rootCls,mainCls,scrollCls in fixes:
  if not os.path.exists(file):
    print('SKIP:', file)
    continue
  c = open(file, encoding='utf8').read()
  c = re.sub(r'[ \t]*const \[activeMenu, setActiveMenu\] = useState\([^)]*\);\r?\n', '', c)
  c = re.sub(r'[ \t]*const \[sidebarOpen, setSidebarOpen\] = useState\([^)]*\);\r?\n', '', c)
  c = re.sub(r'<Sidebar[\s\S]*?\/>', '', c)
  c = re.sub(r'<TopBar[\s\S]*?\/>', '', c)
  c = c.replace('<div className="' + rootCls + '">', '')
  c = c.replace('<div className="' + mainCls + '">', '')
  def wrap_return(m):
    nl = m.group(1)
    indent = m.group(2)
    return 'return (' + nl + indent + '<DashboardLayout title="' + title + '" activeMenu="' + menu + '">'
  c = re.sub(r'return \((\r?\n)([ \t]*)<>', wrap_return, c)
  def wrap_close(m):
    indent = m.group(1)
    return '</DashboardLayout>\n' + indent + ');'
  c = re.sub(r'</>\r?\n([ \t]*)\);', wrap_close, c)
  open(file, 'w', encoding='utf8').write(c)
  print('Fixed:', file)

print('All done!')
