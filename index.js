const express = require('express');
const connectToMongo = require('./db')
const cookieParser = require('cookie-parser')
const app = express()
const cors = require('cors')
const ws = require('ws');
const jwt = require('jsonwebtoken');
const MessageModel = require('./models/Messages');
const JWT_Sercret = 'f,msgnan';
const fs = require('fs');
const port = 3000

connectToMongo();

app.use(cookieParser())
app.use(cors({
  credentials: true,
  origin: 'http://127.0.0.1:5173'
}))
app.use('/uploads', express.static(__dirname + '/uploads'));
app.use(express.json());
app.use("/auth", require('./routes/auth.js'))

const server = app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

const wss = new ws.WebSocketServer({ server });

wss.on('connection', (connection, req) => {

  function notifyAboutOnlinePeople() {
     // notify everyone about online people (when someone connects)
     [...wss.clients].forEach(client => {
      client.send(JSON.stringify({
        online: [...wss.clients].map(c => ({ userId: c.userId, username: c.username })
        )
      }))
    })
  }

  connection.isAlive = true;

 connection.timer = setInterval(() => {
    connection.ping();
     connection.deathTimer = setTimeout(() => {
      connection.isAlive = false;
      clearInterval(connection.timer)
      connection.terminate();
      notifyAboutOnlinePeople()
      console.log('death');
    }, 1000);
  }, 4000);

  connection.on('pong',() => {
    clearTimeout(connection.deathTimer)
  })


  // Read username and id from the cookie for this connection
  const cookies = req.headers.cookie;
  console.log(cookies);                

  if (cookies) {
    const tokenCookieString = cookies.split(';').find(str => str.startsWith('token='));

    if (tokenCookieString) {
      const token = tokenCookieString.split('=')[1];
     
      if(token) {
        jwt.verify(token, JWT_Sercret, {}, (err, userData) => {
          if (err) throw err
          const { userId, username } = userData;
  
          connection.userId = userId;
          connection.username = username;
        });
      }

    }
      
      connection.on('message',async (message) => {
        let msgData = JSON.parse(message);
        console.log(msgData);
        const {recipient,text,file} = msgData;
        let filename = null;
        console.log({file});
       
        if(file) {
          const parts = file.name.split(".");
          const ext = parts[parts.length - 1];
          filename = Date.now() + '.'+ext; 
          const path = __dirname + '/uploads/' + filename;
          const  bufferData = new Buffer(file.data.split(',')[1],'base64')

          fs.writeFile(path,bufferData,() => {
            console.log('file saved'+path);
          });
        }

        if(recipient && (text || file)) {
        const messageDoc = await MessageModel.create({
            sender : connection.userId,
            recipient,
            text,
            file : file ? filename : null,
          });
          
          console.log(messageDoc);

          [...wss.clients]
          .filter(c => c.userId === recipient)
          .forEach(c => c.send(JSON.stringify({text,sender : connection.userId,_id : messageDoc._id})));
        }
      });

    };
    notifyAboutOnlinePeople()
})






