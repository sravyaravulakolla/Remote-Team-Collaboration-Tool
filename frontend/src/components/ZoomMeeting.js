import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
const backendUrl = process.env.REACT_APP_BACKEND_URL;

const ZoomMeeting = () => {
  const { roomId } = useParams(); // Retrieve the chatId from the URL
  const [meetingData, setMeetingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch or create meeting details using the roomId (chatId)
    const fetchOrCreateMeeting = async () => {
      try {
        const response = await axios.get(
         `${backendUrl}/api/zoom/join-or-create-meeting/${roomId}`
        );
        setMeetingData(response.data); // Set the meeting details
      } catch (error) {
        console.error("Error fetching or creating meeting details:", error);
        setError("Failed to retrieve or create meeting. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrCreateMeeting();
  }, [roomId]);

  // Once meetingData is available, join the meeting automatically
  useEffect(() => {
    if (meetingData && meetingData.joinUrl) {
      // Automatically redirect to join the meeting using joinUrl
      window.location.href = meetingData.joinUrl;
    }
  }, [meetingData]);

  return (
    <div>
      {loading ? (
        <p>Loading meeting details...</p>
      ) : error ? (
        <p>{error}</p>
      ) : meetingData ? (
        <p>Joining meeting...</p>
      ) : (
        <p>No meeting data found.</p>
      )}
    </div>
  );
};

export default ZoomMeeting;