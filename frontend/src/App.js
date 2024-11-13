import './App.css';
import { Route } from 'react-router-dom';
import Homepage from './Pages/Homepage';
import Chatpage from './Pages/Chatpage';
import ZoomMeeting from './components/ZoomMeeting';

function App() {
  return (
    <div className="App">
      <Route path="/" component={Homepage} exact/>
      <Route path="/chats" component={Chatpage}/>
      <Route path="/video-call/:roomId" component={ZoomMeeting}/>
    </div>
  );
}

export default App;