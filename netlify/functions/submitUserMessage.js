import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

exports.handler = async function (event) {
  const messages = JSON.parse(event.body);
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: messages,
  });
  if (response.status === 200) {
    const assistantMessage = response.data.choices[0].message;
    return {
      statusCode: 200,
      body: JSON.stringify([...messages, assistantMessage]),
    }
  } else {
    return {
      statusCode: response.status,
      body: response.statusText, 
    }
  }
};
