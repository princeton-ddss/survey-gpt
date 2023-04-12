import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

exports.handler = async function (event) {
  const messages = JSON.parse(event.body);
  openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: JSON.parse(event.body),
  })
    .then((response) => {
      const assistantMessage = response.data.choices[0].message;
      return {
        statusCode: 200,
        body: JSON.stringify([...messages, assistantMessage]),
      }
    })
    .catch((response) => {
      return {
        statusCode: 400,
        body: JSON.stringify(response), // TODO: extract meaningful info...
      }
    })
};
