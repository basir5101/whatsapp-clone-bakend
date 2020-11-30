//importing
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import Message from './dbMessages.js';
import Pusher from 'pusher';

//app config
const app = express()
const port = process.env.PORT || 5000
app.use(cors());

const pusher = new Pusher({
    appId: "1114967",
    key: "27751498ccec5fb1e977",
    secret: "d680251259746e1555f9",
    cluster: "ap2",
    useTLS: true
  });

// middleware
app.use(express.json());
app.use((req, res, next) =>{
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Header", "*");
    next();
})

// db config
const connect_url = 'mongodb+srv://shishatola:Munny101@cluster0.jo990.mongodb.net/whatsappdb?retryWrites=true&w=majority'

mongoose.connect(connect_url,{
    useCreateIndex : true,
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const db = mongoose.connection;

db.once('open', () =>{
    console.log('DB Connected');

    const msgCollection = db.collection("massagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on("change", (change) =>{
        console.log(change);
        if(change.operationType === 'insert'){
            const messageDetails = change.fullDocument;
            pusher.trigger("message","inserted", {
                name: messageDetails.name,
                message: messageDetails.message,
                timeStamp: messageDetails.timeStamp,
                received: messageDetails.received
            });
        } else {
            console.log("Errors triggering pusher")
        }
    })
})


// ???

//api routed
app.get('/', (req, res) => {
    res.status(200).send('hello world')
})


app.get('/messages/sync', (req, res) =>{
   Message.find((err, data) =>{
       if(err){
           res.status(500).send(err)
       } else{
           res.status(200).send(data)
       }
   })
})


app.post('/messages/new', (req, res) =>{
    const dbMessage = req.body;

    Message.create(dbMessage, (err, data) =>{
        if(err){
            res.status(500).send(err);
        }
        else {
            res.status(200).send(data)
        }
    })
})

//listen
app.listen(port, () => console.log(`listening the local: ${port}`));
