import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

exports.handler = async function (event, context) {
  const messages = JSON.parse(event.body);
  try {
    const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: messages,
    });
    console.log("1")
    const assistantMessage = response.data.choices[0].message;
    return {
      statusCode: 200,
      body: JSON.stringify([...messages, assistantMessage]),
    }
  } catch (error) {
    if (error.response) {
      console.log("2")
      return {
        statusCode: error.response.status,
        body: `OpenAIError: ${error.message}`,
      }
    } else {
      console.log(error)
      return {
        statusCode: error.status,
        body: `OpenAIError: ${error.message}`,
      }
    }
  }
};
