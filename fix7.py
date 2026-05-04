c = open('app/users-accounts/user-accounts/page.tsx', encoding='utf8').read()
# Replace the indented ua-scroll with properly indented one
c = c.replace('          <div className="ua-scroll">', '      <div className="ua-scroll">')
open('app/users-accounts/user-accounts/page.tsx', 'w', encoding='utf8').write(c)
print('Fixed!')
