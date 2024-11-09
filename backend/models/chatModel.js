// chatName
// isGroupChat
// users
// repositoryName
// latestMessage
// groupAdmin
// meetingId
// joinUrl
// password
const mongoose= require("mongoose");
const chatModel= mongoose.Schema(
    {
        chatName:{type:String, trim: true},
        isGroupChat:{type: Boolean, default: false},
        users:[
            {
                type: mongoose.Schema.Types.ObjectId,
                ref:"User",
            },
        ],
        repositoryName: { type: String, required: true },
        latestMessage:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
        },
        groupAdmin:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
        },
        meetingId: {
                  // Store Zoom meeting ID
                  type: String,
                  default: null,
                },
                joinUrl: {
                  // Store the Zoom meeting join URL
                  type: String,
                  default: null,
                },
                password: {
                  // Store the Zoom meeting password (if any)
                  type: String,
                  default: null,
                },
    },
    {
        timestamps:true,
    }
);
const Chat= mongoose.model("Chat",chatModel);
module.exports=Chat;





// // chatName
// // isGroupChat
// // users
// // latestMessage
// // groupAdmin
// const mongoose= require("mongoose");
// const chatModel = mongoose.Schema(
//   {
//     chatName: { type: String, trim: true },
//     isGroupChat: { type: Boolean, default: false },
//     users: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//       },
//     ],
//     latestMessage: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Message",
//     },
//     groupAdmin: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },
//     meetingId: {
//       // Store Zoom meeting ID
//       type: String,
//       default: null,
//     },
//     joinUrl: {
//       // Store the Zoom meeting join URL
//       type: String,
//       default: null,
//     },
//     password: {
//       // Store the Zoom meeting password (if any)
//       type: String,
//       default: null,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );
// const Chat= mongoose.model("Chat",chatModel);
// module.exports=Chat;