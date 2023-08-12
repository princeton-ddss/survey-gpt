import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

exports.handler = async function (event, context) {
  const data = JSON.parse(event.body);
  const messages = data.messages;
  const surveyId = data.surveyId;
  const userMessage = messages[messages.length - 1]
  console.log(`[${surveyId}]: `, userMessage);
  try {
    const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo-16k",
        messages: messages,
    });
    const assistantMessage = response.data.choices[0].message;
    console.log(`[${surveyId}]: `, assistantMessage);
    return {
      statusCode: 200,
      body: JSON.stringify([...messages, assistantMessage]),
    }
  } catch (error) {
    console.log(`[${surveyId}]: `, error.message);
    if (error.response) {
      return {
        statusCode: error.response.status,
        body: `OpenAIError: ${error.message}`,
      }
    } else {
      return {
        statusCode: error.status,
        body: `OpenAIError: ${error.message}`,
      }
    }
  }
};
