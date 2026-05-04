# Fix my-profile: missing closing tags for modal divs before </DashboardLayout>
c = open('app/my-profile/page.tsx', encoding='utf8').read()
c = c.replace(
    '          </div>\n    </DashboardLayout>',
    '          </div>\n        </div>\n      </div>\n    </DashboardLayout>'
)
open('app/my-profile/page.tsx', 'w', encoding='utf8').write(c)
print('Fixed: my-profile')

# Fix user-accounts: remove orphaned empty lines and the stray <div className="ua-scroll"> 
# that appears outside DashboardLayout (line 798)
c = open('app/users-accounts/user-accounts/page.tsx', encoding='utf8').read()
c = c.replace(
    '      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}\n\n\n\n\n\n\n          <div className="ua-scroll">',
    '      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}\n\n      <div className="ua-scroll">'
)
open('app/users-accounts/user-accounts/page.tsx', 'w', encoding='utf8').write(c)
print('Fixed: user-accounts')

print('All done!')
