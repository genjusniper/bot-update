
      const fs = require('fs');
      let content = fs.readFileSync('index.js', 'utf8');
      
      const searchStr = 'if (proactiveBrain && botEnabled) {\n            proactiveBrain.start(sock, null, ALLOWED_CONTACTS, generateReply);\n          }';
      const replaceStr = ;
          
      if (content.includes(searchStr)) {
          content = content.replace(searchStr, replaceStr);
          fs.writeFileSync('index.js', content);
          console.log('✅ index.js successfully patched!');
      } else {
          console.log('❌ search string not found in index.js');
      }
    
