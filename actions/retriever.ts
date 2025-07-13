import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";


    const spbUrl = process.env.SUPABASE_URL;
    const spbKey = process.env.SUPABASE_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if(!spbUrl || !spbKey || !openaiKey){
        throw new Error("Missing environment variables");
    }

    const embeddings = new OpenAIEmbeddings({openAIApiKey: openaiKey});
    const supabaseClient = createClient(spbUrl, spbKey);

    const vectorStore = new SupabaseVectorStore(embeddings, {
        client: supabaseClient,
        tableName: "documents",
        queryName: "match_documents",
    })

    const retriever = vectorStore.asRetriever();

    export {retriever};