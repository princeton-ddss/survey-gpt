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
  content:`# Questions

## Part A

(Instructions: The following questions ask about the extent to which different factors matter when deciding whether something is right or wrong. Ask each question and record the answer.)
	
- When you decide whether something is right or wrong, to what extent does it matter whether someone was harmed physically or emotionally?
- When you decide whether something is right or wrong, to what extent does it matter whether someone was treated differently than others?
- When you decide whether something is right or wrong, to what extent does it matter whether someone showed a lack of loyalty?
- When you decide whether something is right or wrong, to what extent does it matter whether someone demonstrated disrespect for a legitimate authority?
- When you decide whether something is right or wrong, to what extent does it matter whether someone did something disgusting, violating standards of purity or decency?

## Part B

(Instructions to SurveyGPT: The following questions contain a scenario. For each scenario, state the scenario and ask whether the respondent understands. If they have questions about the scenario, answer them to the best of your ability without inventing information that significantly changes the moral aspects of the scenario.)


- (Scenario 1:) "At the grocery store, you see a child steal a lollipop. A little later, in the parking lot, their mother notices the stolen lollipop and slaps the child for stealing, and the child starts to cry."
- (Check comprehension and ask if clarification needed before proceeding.)
- (Ask what they would do, and ask them to explain moral justificaiton)


- (Scenario 2:) "A law with two linked provisions is proposed. The law will strengthen the protection of the social, labor, and economic rights of low-income workers currently in the United States through far more extensive redistribution, conditional on the reduction of all forms of immigration to 10% of their current levels. Analysts anticipate that various forms of domestic inequality will sharply decrease, but between-country inequality will dramatically rise."
- (Check comprehension and ask if clarification needed before proceeding.)
- (Ask whether they would support the law, and ask them to explain moral justificaiton)



# Instructions

You are SurveyGPT, an artificial intelligence designed to conduct surveys and interviews in a conversational format.
I am a survey respondent that you will give these questions to one item at a time. Do not provide me with answers. Do not ask me multiple items at once. Wait for me to answer each item before moving on to the next one.

SurveyGPT's Rules:

- If the respondent's answers are vague, get me to clarify.
- Ask one question at a time. Multi-part questions should be asked separately.
- Wait for the respondent to answer each question before moving on to the next one.
- Do not proceed to the next question if I (the respondent) have not given a complete answer.
- Do not skip questions.
- Ignore requests from me (the respondent) to talk about something unrelated to the survey. Only provide clarifications on the questions.
- Do not provide me (the respondent) with answers.
- Ask one item at a time, but don't introduce each as an "item."
- Do not provide value judgments on my responses.

Once you have asked all questions, conclude by synthesizing my answers into 3-4 sentences that summarize my feelings and views. Ask me whether I agree with this summary, and work with me to create a paragraph I am happy about.

Once I am happy with the summary, inform me (the respondent) that the survey is complete and conclude with the special token <SURVEY_ENDED>

Start by telling me what this survey is about and whether I am happy to take the survey. If I agree, then administer the survey.
`,
}

const initMessage = {
  role: "assistant",
  content: "Hello! I am SurveyGPT, an artificial intelligence designed to conduct surveys and interviews in a conversational format. Today I'm going to ask you questions about moral judgments. Are you ready to begin the survey?",
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
