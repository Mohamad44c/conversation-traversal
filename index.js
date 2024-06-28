const XLSX = require("xlsx");
const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function rateConversations(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const conversations = XLSX.utils.sheet_to_json(worksheet);

  const conversationRatings = [];

  for (const conversation of conversations) {
    const conversationText = conversation["Conversation"];

    const conversationData = await rateConversation(conversationText);
    conversationRatings.push(conversationData);
  }
  XLSX.writeFile(filePath, conversationRatings);
  return conversationRatings;
}

async function rateConversation(conversationText) {
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `You will be provided with a converation between an AI agent and a user, your task is to classify each conversation with either Excellent, Good, Average, Poor, Terrible: ${conversationText}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 64,
    top_p: 1,
  });

  const rating = response.choices[0].message.content;
  const input = response.usage.prompt_tokens;
  const output = response.usage.completion_tokens;

  const conversationData = {
    rating: rating,
    input: input,
    output: output,
  };

  // console.log("conversationData: ", conversationData);
  console.log(
    `\nConversation data: \n Rating: ${conversationData.rating}\n Cost: input: ${conversationData.input} tokens / output: ${conversationData.output} token(s)`
  );
  return conversationData;
}

(async () => {
  const filePath = "./SampleConvos.xlsx";
  const ratings = await rateConversations(filePath);
})();
