import os

# Fix my-profile - remove orphaned closing divs and fix modal placement
profile = open('app/my-profile/page.tsx', encoding='utf8').read()
profile = profile.replace('''          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}''', '''          </div>

      {/* Edit Profile Modal */}''')
profile = profile.replace('''          </div>
    </DashboardLayout>''', '''          </div>
    </DashboardLayout>''')
# Fix unclosed modal - add missing closing divs before </DashboardLayout>
profile = profile.replace(
  "              {saving ? <><Loader2 size={14} className=\"spin\" />Updating…</> : 'Update Password'}\n            </button>\n          </div>\n        </div>\n      </div>\n    </DashboardLayout>",
  "              {saving ? <><Loader2 size={14} className=\"spin\" />Updating…</> : 'Update Password'}\n            </button>\n          </div>\n        </div>\n      </div>\n\n    </DashboardLayout>"
)
open('app/my-profile/page.tsx', 'w', encoding='utf8').write(profile)
print('Fixed: my-profile')

# Fix all-roles - remove 3 orphaned closing divs before modals
roles = open('app/role-management/all-roles/page.tsx', encoding='utf8').read()
roles = roles.replace(
  '            </div>\n          </div>\n        </div>\n\n        {/* Create Modal */}',
  '            </div>\n\n        {/* Create Modal */}'
)
open('app/role-management/all-roles/page.tsx', 'w', encoding='utf8').write(roles)
print('Fixed: all-roles')

# Fix user-accounts - remove 3 orphaned closing divs before dialogs
ua = open('app/users-accounts/user-accounts/page.tsx', encoding='utf8').read()
ua = ua.replace(
  '            </div>\n\n          </div>\n        </div>\n      </div>\n\n      <EditDialog',
  '            </div>\n\n      <EditDialog'
)
open('app/users-accounts/user-accounts/page.tsx', 'w', encoding='utf8').write(ua)
print('Fixed: user-accounts')

print('All done!')
