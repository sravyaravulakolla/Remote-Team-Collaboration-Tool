const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
const router = express.Router();
const Chat = require("../models/chatModel");

dotenv.config(); // Load environment variables

const ZOOM_API_URL = "https://api.zoom.us/v2";
const CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;
const ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID; // Account ID (can be obtained from Zoom dashboard)

const ZOOM_TOKEN_URL = "https://zoom.us/oauth/token";
const authHeader =
  "Basic " + Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64");

// Function to get access token using Account Credentials
const getZoomAccessToken = async () => {
  try {
    const response = await axios.post(`${ZOOM_TOKEN_URL}`, null, {
      params: {
        grant_type: "account_credentials",
        account_id: ACCOUNT_ID, // Your Zoom account ID
      },
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    // Return the access token
    return response.data.access_token;
  } catch (error) {
    console.error("Error getting Zoom access token:", error);
    throw new Error("Unable to get Zoom access token");
  }
};

// Helper function to create a Zoom meeting
const createZoomMeeting = async (
  chatId,
  topic = "Group Meeting",
  startTime = null,
  duration = 30
) => {
  try {
    const accessToken = await getZoomAccessToken(); // Get access token using account credentials

    const response = await axios.post(
      `${ZOOM_API_URL}/users/me/meetings`, // Correct URL with string interpolation
      {
        topic,
        type: 2, // Scheduled meeting
        start_time: startTime,
        duration,
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: true,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`, // Correct Authorization header
          "Content-Type": "application/json",
        },
      }
    );

    // Save the meeting ID and join URL to the chat document in the database
    const meetingId = response.data.id;
    await Chat.findByIdAndUpdate(chatId, {
      meetingId,
      joinUrl: response.data.join_url,
    });

    return {
      meetingId: response.data.id,
      joinUrl: response.data.join_url,
      password: response.data.password,
    };
  } catch (error) {
    console.error("Error creating Zoom meeting:", error);
    throw new Error("Unable to create Zoom meeting");
  }
};

// Endpoint to create or fetch an existing meeting for a chat
router.get("/join-or-create-meeting/:chatId", async (req, res) => {
  const { chatId } = req.params;

  try {
    let chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (chat.meetingId && chat.joinUrl) {
      // If a meeting ID and URL already exist, return them
      res.json({
        meetingId: chat.meetingId,
        joinUrl: chat.joinUrl,
        message: "Joining existing meeting",
      });
    } else {
      // If no meeting exists, create one
      const newMeeting = await createZoomMeeting(chatId);
      res.json({
        ...newMeeting,
        message: "New meeting created",
      });
    }
  } catch (error) {
    console.error("Error in join-or-create-meeting route:", error);
    res.status(500).send("Failed to process the request");
  }
});

module.exports = router;
