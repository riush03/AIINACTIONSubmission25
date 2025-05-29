import google.generativeai as genai

class GeminiEmbeddings:
    def __init__(self, model="models/embedding-001"):
        self.model = model
    
    def embed_documents(self, texts):
        """Embed a list of documents"""
        embeddings = []
        for i, text in enumerate(texts):
            try:
                result = genai.embed_content(
                    model=self.model,
                    content=text
                )
                embeddings.append(result['embedding'])
                if (i + 1) % 50 == 0:  # Progress indicator
                    print(f"Embedded {i + 1}/{len(texts)} documents")
            except Exception as e:
                print(f"Error embedding document {i}: {e}")
                # Use zero vector as fallback
                embeddings.append([0.0] * 768)
        return embeddings
    
    def embed_query(self, text):
        """Embed a single query"""
        try:
            result = genai.embed_content(
                model=self.model,
                content=text
            )
            return result['embedding']
        except Exception as e:
            print(f"Error embedding query: {e}")
            return [0.0] * 768