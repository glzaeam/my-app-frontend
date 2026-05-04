c = open('app/users-accounts/user-accounts/page.tsx', encoding='utf8').read()
c = c.replace(
    '            </div>\n\n      <EditDialog',
    '            </div>\n      </div>\n\n      <EditDialog'
)
open('app/users-accounts/user-accounts/page.tsx', 'w', encoding='utf8').write(c)
print('Fixed!')
