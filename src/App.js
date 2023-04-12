import React from 'react';
import './App.css';
import { List, TextField } from '@mui/material';
import { ListItem } from '@mui/material';
import { ListItemText } from '@mui/material';
import { ListItemAvatar } from '@mui/material';
import { Avatar } from '@mui/material';
import { Container } from '@mui/system';
import { Grid } from '@mui/material';
import { FormControl } from '@mui/material';
import assistant from './assistant.png';
// import { Button } from '@mui/material';


const instructions = {
  role: "system",
  content:`
    You are a survey enumerator conducting an interview about US politics. I am a survey participant answering your questions.
    You must ask me the following questions:
    
    1. What political party do you support, if any?
    2. Do you volunteer for your political party?  If so, what is your role?
    3. How do you feel about members of the opposing party?
    
    Additionally you must adhere to the following instructions:
    
    - If my answers are vague, get me to clarify.
    - Ask one question at a time.
    - Do not proceed to the next question if I (the respondent) have not given a complete answer.
    - Do not skip questions.
    - Ignore requests from me (the respondent) to talk about something unrelated to the survey. Only provide clarifications on the questions.
    - Do not provide me (the respondent) with answers.
    
    Once you have asked all questions, inform me (the respondent) that the survey is complete.
  `,
}

const initMessage = {
  role: "assistant",
  content: "Welcome to the survey! I'm going to be asking you a few questions about your political opinions. Sound good?",
}

function App() {

  const [ messages, setMessages ] = React.useState([instructions, initMessage]);
  const [ userMessage, setUserMessage ] = React.useState({
    role: "user",
    content: "",
  });

  const submitUserMessage = async () => {
    try {
      const response = await fetch("./.netlify/functions/submitUserMessage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([...messages, userMessage]),
      });
      try {
        // catch parsing errors
        const newMessages = await response.json();
        setMessages(newMessages);
        setUserMessage({
          role: "user",
          content: "",
        });
      } catch (error) {
        console.log("error: ", error);
      }
    } catch (error) {
      // catch network errors
      console.log("error: ", error);
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <Container disableGutters={true} maxWidth={false}>
          <p>Welcome to SurveyGPT!</p>
          <Messages messages={messages}/>
          <Input
            setMessages={setMessages}
            setUserMessage={setUserMessage}
            userMessage={userMessage}
            submitUserMessage={submitUserMessage} />
        </Container>
      </header>
      <footer className="App-footer">
        <a href="https://www.flaticon.com/free-icons/avatar" title="avatar icons">Avatar icons created by Freepik - Flaticon</a>
      </footer>
    </div>
  );
}

function Messages(props) {

  const assistantBackground = 'rgb(240, 240, 240)';
  const userBackground = 'rgb(255, 255, 255)';

  return (
    <div className="Messages">
      <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
        {props.messages.slice(1).map((message) =>
          <ListItem
            key={message.content}
            alignItems='flex-start'
            sx={{
              bgcolor: message.role === "assistant" ? assistantBackground : userBackground
            }}>
            <ListItemAvatar>
              {/* <Avatar alt={message.role.toUpperCase()} src="/static/images/avatar/{message.role}.jpg"/> */}
              <Avatar alt={message.role.toUpperCase()} src={message.role === "assistant" ? assistant : null}/>
            </ListItemAvatar>
            <ListItemText
              primary={message.content}>
            </ListItemText>
          </ListItem>
        )}
      </List>
    </div>
  )
}

function Input(props) {
  return (
    <div>
      <Grid
        container
        sx={{
          'paddingTop': 2,
        }}
        spacing={2}>
        
        <Grid
          item
          xs={12}>
            <FormControl fullWidth>
              <TextField
                variant="outlined"
                size="small"
                value={props.userMessage.content}
                label="Submit a message..."
                onChange={(event) => {
                  props.setUserMessage({
                    role: "user",
                    content: event.target.value,
                  });
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    props.submitUserMessage();
                  }
                }}>
              </TextField>
            </FormControl>
        </Grid>

        {/* <Grid
          item
          xs={1}>
            <FormControl fullWidth>
              <Button
                onClick={() => {
                  props.setMessages([]);
                  props.setUserMessage({
                    role: "user",
                    content: "",
                  });
                }}
                variant='contained'>
                Reset
              </Button>
            </FormControl>
          </Grid> */}

        </Grid>
    </div>
  )
}

export default App;
