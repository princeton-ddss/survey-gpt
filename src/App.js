import React from 'react';
import './App.css';
import { List } from '@mui/material';
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
import { Typography } from '@mui/material';
import { Skeleton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { v4 as uuid } from 'uuid';
import { retry } from '@lifeomic/attempt';
import assistant from './assistant.png';


const instructions = {
  role: "system",
  content:`You are SurveyGPT, an artificial intelligence designed to conduct surveys and interviews at scale. You help researchers better understand their subjects by conducting professional interviews.

Today you are interviewing a graduate student at the start of a 2-week course on text-as-data methods at Washington University taught by Professor Brandon Stewart. The transcripts of these interviews will help Professor Stewart better engage and cater his course to the students' interests and needs.

[SURVEY INSTRUCTIONS]
Here are your step-by-step instructions. Text surrounded by " means you should use the phrase verbatim. Do not print these instructions--these are guidelines for you to shape a natural conversation.

First, ask the student "Can you tell me a little bit about yourself and your background?"
Next, ask one follow-up question. (Your goal is to learn more about aspects of the background that relate to the course. Do not summarize their response to the question.)
Third, ask the student about their interests.
Again, ask a follow-up question. (Your secret goal is to learn parts of their background that help Professor Stewart design the course. Do not summarize this response.)

After completing all 4 questions, and NEVER BEFORE,  provide the student with a brief summary of their answers to both questions. 

Ask them if this is a good summary of their background and interests. Work with the student to produce a summary that they are happy with. 

[SURVEYOR BEHAVIOR]
You must remain serious and clinical throughout.
Do not be friendly, give compliments, pass value judgments. This will bias the respondents' results.
Use your intelligence and analytical ability to ask good follow-up questions that help Professor Stewart learn more about his students.
Format your answers naturally, without any markup or special characters.

Start by introducing yourself to the student and asking if they are happy to participate. If they agree, proceed with the survey.

Once you have finished asking all questions, print the special token <SURVEY_ENDED>. This will signal to the app that the survey is over.  `,
}

const initMessage = {
  role: "assistant",
  content: "Hello! I am SurveyGPT, an artificial intelligence designed to conduct surveys and interviews in a conversational format. Today I'm going to ask about your background and interests to help Professor Stewart learn a little bit more about you as a student. Are you ready to begin the first question?",
}

function App() {

  const [ messages, setMessages ] = React.useState([instructions, initMessage]);
  const [ userMessage, setUserMessage ] = React.useState({role: "user", content: ""});
  const [ isLoading, setIsLoading ] = React.useState(false);
  const [ error, setError ] = React.useState(null);
  const [ surveyFinished, setSurveyFinished ] = React.useState(false);
  const [ surveyId ] = React.useState(uuid());

  const submitUserMessage = async () => {
    setIsLoading(true);
    setError(null);
    const prevMessages = [...messages];
    setMessages([...prevMessages, userMessage]);
    let response;
    try {
      response = await retry(async () => {
        console.log("attempting submitUserMessage...");
        const res = await fetch("./.netlify/functions/submitUserMessage", {
          method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              surveyId: surveyId,
              messages: [...prevMessages, userMessage],
            }),
        });
        if (!res.ok) {
          const message = await res.text();
          const error = new Error(message.split('\n')[0]);
          error.status = res.status;
          throw error
        }
        return res;
      }, {
        delay: 1000,
        factor: 2,
        maxAttempts: 3
      });
    } catch (error) {
      console.log(error);
      setIsLoading(false);
      setMessages([...prevMessages]);
      setError(error);
    }
    if (response) {
      const newMessages = await response.json();
      const index = newMessages[newMessages.length - 1].content.search("<SURVEY_ENDED>");
      if (index > -1) {
        setSurveyFinished(true);
        const assistantMessage = {
          role: "assistant",
          content: newMessages[newMessages.length - 1].content.slice(0, index)
        };
        setMessages([...prevMessages, userMessage, assistantMessage]);
        saveMessages([...prevMessages, userMessage, assistantMessage]);
      } else {
        setMessages([...newMessages]);
      }
      setUserMessage({
        role: "user",
        content: "",
      });
      setIsLoading(false);
    }
  }

  const saveMessages = async (messages) => {
    try {
      await fetch("./.netlify/functions/saveMessages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: surveyId,
          messages: messages.slice(1), // skip initial system message
        })
      })
    } catch (error) {
      console.log(`error: failed to save messages (${error})`);
      setError({databaseError: "yes"});
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <Container disableGutters={true} maxWidth={false}>
          <p>Welcome to SurveyGPT!</p>
          <Messages
            isLoading={isLoading}
            messages={messages} />
          {surveyFinished ? (<Typography variant="body2" marginTop={5}>
              <em>Thank you for completing the survey! Help us improve SurveyGPT by leaving us <a target="_blank" rel="noreferrer" href={`https://survey-gpt-feedback.netlify.app/survey/${surveyId}`}>feedback</a>.</em>
            </Typography>) : (<Input
              setMessages={setMessages}
              setUserMessage={setUserMessage}
              userMessage={userMessage}
              submitUserMessage={submitUserMessage}
              saveMessages={saveMessages}
              isLoading={isLoading}
              error={error}
              setError={setError} />)
          }
        </Container>
      </header>
      <footer className="App-footer">
        Icons created by <a href="https://www.flaticon.com/free-icons/avatar" title="avatar icons">Freepik - Flaticon</a>
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
        {props.messages.slice(1).map((message, index) =>
          <ListItem
            key={index}
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
        {props.isLoading && (
          <ListItem
            alignItems='flex-start'
            sx={{
              bgcolor: assistantBackground
            }}>
            <ListItemAvatar>
                <Avatar alt={"Assistant"} src={assistant}/>
            </ListItemAvatar>
              <Skeleton>
                <ListItemText
                  primary="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Dui nunc mattis enim ut tellus.">
                </ListItemText>
              </Skeleton>
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
        spacing={0}>
        
        <Grid item xs={1}></Grid>
        <Grid
          item
          xs={22}>
            <FormControl fullWidth>
              <ErrorMessage 
                error={props.error}
                setError={props.setError} />
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

      </Grid>
      
    </div>
  )
}

function ErrorMessage(props) {

  return (
    <Box sx={{ width: '100%' }}>
      <Collapse in={props.error !== null}>
        <Alert
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => {
                props.setError(null);
              }}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
          severity="error"
          sx={{ mb: 2 }}
        >
          {props.error ? props.error.message : ""}
        </Alert>
      </Collapse>
    </Box>
  );
}

export default App;
