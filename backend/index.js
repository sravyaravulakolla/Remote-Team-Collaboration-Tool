const express= require("express");
const dotenv= require("dotenv");
const {chats}= require("./data/data");
const connectDB = require("./config/db");
const colors= require("colors");
const userRoutes= require("./routes/userRoutes");
const chatRoutes= require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const videoRoutes = require("./routes/videoRoutes"); // Import video routes
const repoRoutes = require("./routes/repoRoutes"); // Import repo routes
const taskRoutes = require("./routes/taskRoutes");
const phaseRoutes = require("./routes/phaseRoutes"); 
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

dotenv.config();
connectDB();

const app= express();
const cors = require('cors');
app.use(cors());  // This will allow all origins

app.use(express.json()); //to accept JSON Data   

app.get('/',(req, res)=>{
    res.send("API is running successfully");
});
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/zoom', videoRoutes); // Zoom video routes
app.use('/api/repo', repoRoutes); // Use the repo routes for '/api/repo'

app.use("/api/tasks", taskRoutes);
app.use("/api/phase", phaseRoutes);
app.use(notFound);
app.use(errorHandler);

const PORT= process.env.PORT || 5000;
const server= app.listen(PORT, console.log(`Server started on port ${PORT}`.yellow.bold));

const io = require("socket.io")(server, {
    pingTimeout: 60000,
  cors: {
    origin: "http://localhost:3000",
  },
});
io.on("connection",(socket)=>{
    console.log("Connected to socket.io");
    socket.on("setup",(userData)=>{
      socket.join(userData._id);
      // console.log(userData._id);
      
      socket.emit("connected");
    });
    socket.on("join chat",(room)=>{
      socket.join(room);
      console.log("User Joined a room"+room);
      
    });
    socket.on("new message",(newMessageReceived)=>{
      var chat= newMessageReceived.chat;
      if(!chat.users) return console.log("chat.users not defined");
      chat.users.forEach(user => {
        if(user._id===newMessageReceived.sender._id) return;
        socket.in(user._id).emit("message received", newMessageReceived);
      });
    });
    socket.on("typing", (room)=>socket.in(room).emit("typing"));
    socket.on("stop typing",(room)=>socket.in(room).emit("stop typing"));
    socket.on("disconnect", () => {
              console.log("USER DISCONNECTED");
              // You can also leave specific rooms if needed
              socket.rooms.forEach((room) => socket.leave(room));
    });
});



// const express = require("express");
// const dotenv = require("dotenv");
// const connectDB = require("./config/db");
// const colors = require("colors");
// const userRoutes = require("./routes/userRoutes");
// const chatRoutes = require("./routes/chatRoutes");
// const messageRoutes = require("./routes/messageRoutes");
// const videoRoutes = require("./routes/videoRoutes"); // Import video routes
// const { notFound, errorHandler } = require("./middleware/errorMiddleWare");

// dotenv.config(); // Load environment variables
// connectDB(); // Connect to database

// const app = express();
// app.use(express.json()); // To accept JSON data

// // Default endpoint to check API
// app.get('/', (req, res) => {
//     res.send("API is running successfully");
// });

// // API Routes
// app.use('/api/user', userRoutes);
// app.use('/api/chat', chatRoutes);
// app.use('/api/message', messageRoutes);
// app.use('/api/zoom', videoRoutes); // Zoom video routes

// // Error Handling Middleware
// app.use(notFound);
// app.use(errorHandler);

// // Start server
// const PORT = process.env.PORT || 5000;
// const server = app.listen(PORT, () =>
//     console.log(`Server started on port ${PORT}`.yellow.bold)
// );

// // Socket.IO setup
// const io = require("socket.io")(server, {
//     pingTimeout: 60000,
//     cors: {
//         origin: "http://localhost:3000", // Update this if needed for production
//     },
// });

// io.on("connection", (socket) => {
//     console.log("Connected to socket.io");

//     // Setup event - user connects
//     socket.on("setup", (userData) => {
//         socket.join(userData._id); // Join room based on user ID
//         socket.emit("connected"); // Notify user that they're connected
//     });

//     // Join chat event
//     socket.on("join chat", (room) => {
//         socket.join(room);
//         console.log(`User joined room: ${room}`);
//     });

//     // New message event - send message to all users in the chat except the sender
//     socket.on("new message", (newMessageReceived) => {
//         var chat = newMessageReceived.chat;
//         if (!chat.users) return console.log("chat.users not defined");
        
//         chat.users.forEach((user) => {
//             if (user._id === newMessageReceived.sender._id) return;
//             socket.in(user._id).emit("message received", newMessageReceived); // Emit message to all other users
//         });
//     });

//     // Typing indicator events
//     socket.on("typing", (room) => socket.in(room).emit("typing"));
//     socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

//     // Cleanup when user disconnects
//     socket.on("disconnect", () => {
//         console.log("USER DISCONNECTED");
//         // You can also leave specific rooms if needed
//         socket.rooms.forEach((room) => socket.leave(room));
//     });
// });
