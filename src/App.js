import React from 'react';
import './App.css';
import { LinearProgress, List } from '@mui/material';
import { ListItem } from '@mui/material';
import { ListItemText } from '@mui/material';
import { ListItemAvatar } from '@mui/material';
import { Avatar } from '@mui/material';
import { Container } from '@mui/system';
import { Grid } from '@mui/material';
import { FormControl } from '@mui/material';
import { TextField } from '@mui/material';
import { Box } from '@mui/material';
import { Alert } from '@mui/material';
import { IconButton } from '@mui/material';
import { Collapse } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { uuid } from 'uuidv4';
import assistant from './assistant.png';


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
    
    Once you have asked all questions, inform me (the respondent) that the survey is complete. End your last message with the token "TASK_DONE". 
  `,
}

const initMessage = {
  role: "assistant",
  content: "Hello! I'm SurveyGPT, an automated survey assistant based on ChatGPT. I'm going to be asking you a few questions about your political opinions today. Are you ready to begin?",
}

function App() {

  const [ messages, setMessages ] = React.useState([instructions, initMessage]);
  const [ userMessage, setUserMessage ] = React.useState({role: "user", content: ""});
  const [ isLoading, setIsLoading ] = React.useState(false);
  const [ errorState, setErrorState ] = React.useState({networkError: null});
  const [ surveyFinished, setSurveyFinished ] = React.useState(false);

  const submitUserMessage = async () => {
    setIsLoading(true);
    setMessages([...messages, userMessage]);
    try {
      const response = await fetch("./.netlify/functions/submitUserMessage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([...messages, userMessage]),
      });
      const newMessages = await response.json();
      console.log(newMessages[newMessages.length - 1]);
      const index = newMessages[newMessages.length - 1].content.search("TASK_DONE");
      console.log("index=", index);
      if (index > -1) {
        setSurveyFinished(true);
        const finalMessage = {
          role: newMessages[newMessages.length - 1].role,
          content: newMessages[newMessages.length - 1].content.slice(0, index)
        };
        setMessages([...messages, userMessage, finalMessage]);
        saveMessages([...messages, userMessage, finalMessage]);
      } else {
        setMessages(newMessages);
      }
    } catch (error) {
      console.log(`error: failed to reach openai (${error})`);
      setMessages(messages.slice(0, messages.length)); // pop userMessage
      setErrorState({networkError: "yes"});
    }
    setIsLoading(false);
    setUserMessage({
      role: "user",
      content: "",
    });
  }

  const saveMessages = async (messages) => {
    setIsLoading(true);
    try {
      await fetch("./.netlify/functions/saveMessages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          session: uuid(),
          messages: messages.slice(1), // skip initial system message
        })
      })
    } catch (error) {
      console.log(`error: failed to save messages (${error})`);
      setErrorState({databaseError: "yes"});
    }
    setIsLoading(false);
  }

  return (
    <div className="App">
      <header className="App-header">
        <Container disableGutters={true} maxWidth={false}>
          <p>Welcome to SurveyGPT!</p>
          <Messages
            messages={messages} />
          {!surveyFinished && (<Input
            setMessages={setMessages}
            setUserMessage={setUserMessage}
            userMessage={userMessage}
            submitUserMessage={submitUserMessage}
            saveMessages={saveMessages}
            isLoading={isLoading}
            errorState={errorState}
            setErrorState={setErrorState} />)} 
        </Container>
      </header>
      <footer className="App-footer">
        <a href="https://www.flaticon.com/free-icons/avatar" title="avatar icons">Avatar icons created by Freepik - Flaticon</a>
      </footer>
    </div>
  );
}

function Messages(props) {

  const assistantBackground = 'rgb(247, 247, 247)';
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
    <div className="Input">

      <Grid
        container
        columns={24}
        sx={{
          'paddingTop': 2,
        }}
        spacing={2}>
        
        <Grid item xs={1}></Grid>
        <Grid
          item
          xs={22}>
            <FormControl fullWidth>
              <NetworkError 
                errorState={props.errorState}
                setErrorState={props.setErrorState} />
            </FormControl>
        </Grid>
        <Grid item xs={1}></Grid>

      </Grid>

      <Grid
        container
        columns={24}
        sx={{
          'paddingTop': 2,
        }}
        spacing={2}>
        
        <Grid item xs={1}></Grid>
        <Grid
          item
          xs={22}>
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
        <Grid item xs={1}></Grid>

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
      
      {props.isLoading && (
        <Grid
          container
          columns={24}
          sx={{
            'paddingTop': 2,
          }}
          spacing={2}>
          <Grid item xs={1}></Grid>
          <Grid
            item
            xs={22}>
              <FormControl fullWidth>
                <LinearProgress></LinearProgress>
              </FormControl>
          </Grid>
          <Grid item xs={1}></Grid>
        </Grid>
      )}

      {/* <Grid
        container
        sx={{
          'paddingTop': 2,
        }}
        spacing={2}>
        
        <Grid item xs={5}></Grid>
        <Grid
          item
          xs={2}>
            <FormControl fullWidth>
              <Button
                variant="contained"
                onClick={props.saveMessages}>
                  Submit
              </Button>
            </FormControl>
        </Grid>
        <Grid item xs={5}></Grid>

      </Grid> */}
      
    </div>
  )
}

function NetworkError(props) {

  return (
    <Box sx={{ width: '100%' }}>
      <Collapse in={props.errorState.networkError !== null}>
        <Alert
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => {
                console.log(props.errorState);
                props.setErrorState({networkError: null});
                console.log(props.errorState);
              }}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
          severity="error"
          sx={{ mb: 2 }}
        >
          Error {props.errorState.networkError}
        </Alert>
      </Collapse>
    </Box>
  );
}

export default App;
