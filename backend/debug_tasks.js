require('dotenv').config();
const db = require("./config/database.js");

async function test() {
    try {
        console.log("Running debug query...");
        
        let query = `
           SELECT 
              t.id, t.title, t.user_id,
              u.name as assignee_name, u.email as assignee_email
           FROM task t
           LEFT JOIN users u ON t.user_id = u.id
        `;
        
        const [rows] = await db.query(query);
        console.log("Found " + rows.length + " tasks.");
        rows.forEach(r => {
            console.log(`Task [${r.title}] UserID: ${r.user_id} -> Name: ${r.assignee_name}, Email: ${r.assignee_email}`);
        });

        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}

test();
