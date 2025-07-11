"use server";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

export async function startOrNot(userInput: string) {
    const openaiKey = process.env.OPENAI_API_KEY;
    const llm = new ChatOpenAI({openAIApiKey: openaiKey})
    const template = `You are an intent classifier. Analyze if the user input describes a software project they want to build.

            Return only "true" or "false".

            Return "true" if:
            - User describes wanting to build/create/develop software
            - User explains app/website/platform functionality
            - User mentions technical requirements

            Return "false" if:
            - General conversation/greetings
            - Questions about the platform
            - Vague statements without clear project intent

            Input: {user_input}
            Classification:`
    const prompt = PromptTemplate.fromTemplate(template);
    const chain = prompt.pipe(llm).pipe(new StringOutputParser());
    const result = await chain.invoke({user_input: userInput});
    return result;
}