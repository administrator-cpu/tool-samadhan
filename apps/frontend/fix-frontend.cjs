const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else if (dirPath.endsWith('.ts') || dirPath.endsWith('.tsx')) {
      callback(path.join(dir, f));
    }
  });
}

walkDir('src', filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  content = content
    .replace(/api\.post\("\/employees"/g, 'api.post("/users/employees"')
    .replace(/api\.get\("\/employees"/g, 'api.get("/users/employees"')
    .replace(/api\.delete\(`\/employees\//g, 'api.delete(`/users/employees/')
    .replace(/api\.patch\(`\/employees\//g, 'api.put(`/users/employees/')
    
    .replace(/api\.post\("\/customers"/g, 'api.post("/users/customers"')
    .replace(/api\.get\(`\/customers\?/g, 'api.get(`/users/customers?')
    .replace(/api\.delete\(`\/customers\//g, 'api.delete(`/users/customers/')
    
    .replace(/api\.get\("\/agents"\)/g, 'api.get("/users/agents")')
    
    .replace(/api\.get\("\/me"\)/g, 'api.get("/users/me")')
    .replace(/api\.patch\("\/me"/g, 'api.put("/users/profile"')
    
    .replace(/api\.patch\(`\/tickets\/\$\{ticketId\}\/reassign`/g, 'api.post(`/tickets/${ticketId}/reassign`')
    .replace(/api\.patch\(`\/tickets\/\$\{ticketId\}\/outage-details`/g, 'api.patch(`/tickets/${ticketId}/outage`')
    
    .replace(/api\.patch\(`\/tickets\/\$\{id\}\/toggle-customer-reply`/g, 'api.patch(`/tickets/${id}/reply-status`')
    
    .replace(/api\.patch\(`\/tickets\/\$\{ticket\.id\}\/rate`/g, 'api.post(`/tickets/${ticket.id}/rate`')

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
});

console.log("Frontend fixes applied");
