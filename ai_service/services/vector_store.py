import os
import json
import math
import hashlib
from typing import List, Dict, Any, Optional
from langchain_openai import OpenAIEmbeddings

try:
    from pypdf import PdfReader  # type: ignore
except ImportError:
    PdfReader = None


class VectorStore:
    """A lightweight, embedded vector store that parses local markdown medical guidelines,
    computes OpenAI embeddings, caches them in a JSON file, and performs cosine similarity search."""

    def __init__(self, kb_dir: str = None, cache_file: str = None):
        # Set default directories
        if kb_dir is None:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            self.kb_dir = os.path.abspath(os.path.join(current_dir, "..", "knowledge_base"))
        else:
            self.kb_dir = kb_dir

        if cache_file is None:
            self.cache_file = os.path.join(self.kb_dir, "embeddings_cache.json")
        else:
            self.cache_file = cache_file

        self.chunks = []
        self.api_key_valid = False
        
        # Initialize embeddings model if key is present
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key and api_key != "your_openai_api_key_here":
            try:
                self.embeddings = OpenAIEmbeddings(
                    model="text-embedding-3-small",
                    api_key=api_key
                )
                self.api_key_valid = True
            except Exception as e:
                print(f"Warning: Failed to initialize OpenAIEmbeddings model: {e}")
                self.embeddings = None
        else:
            print("Warning: OPENAI_API_KEY is not set or placeholder. RAG will use fallback/mock vector search.")
            self.embeddings = None
            
        self.load_or_build_index()

    def split_markdown_by_headings(self, content: str, source_file: str) -> List[Dict[str, Any]]:
        chunks = []
        lines = content.split('\n')
        
        # Extract the main title (# Title)
        main_title = ""
        for line in lines:
            if line.startswith("# "):
                main_title = line[2:].strip()
                break
        if not main_title:
            main_title = source_file.replace(".md", "").replace("_", " ").title()
                
        current_heading = "General"
        current_chunk = []
        
        for line in lines:
            if line.startswith("## "):
                if current_chunk:
                    chunks.append({
                        "source": source_file,
                        "title": main_title,
                        "heading": current_heading,
                        "text": "\n".join(current_chunk).strip()
                    })
                current_heading = line[3:].strip()
                current_chunk = [f"# {main_title}", line]
            else:
                if current_chunk or line.strip():  # Skip leading empty lines
                    current_chunk.append(line)
                    
        if current_chunk:
            chunks.append({
                "source": source_file,
                "title": main_title,
                "heading": current_heading,
                "text": "\n".join(current_chunk).strip()
            })
        return chunks

    def split_text_by_chunks(self, content: str, source_file: str, chunk_size: int = 150) -> List[Dict[str, Any]]:
        """Generic chunker for PDFs based on word count."""
        chunks = []
        main_title = source_file.replace(".pdf", "").replace("_", " ").title()
        
        words = content.split()
        for i in range(0, len(words), chunk_size):
            chunk_words = words[i:i+chunk_size]
            chunks.append({
                "source": source_file,
                "title": main_title,
                "heading": f"Section {i//chunk_size + 1}",
                "text": " ".join(chunk_words)
            })
        return chunks

    def load_or_build_index(self):
        if not os.path.exists(self.kb_dir):
            os.makedirs(self.kb_dir)
            print(f"Created knowledge base directory: {self.kb_dir}")

        # Try to load existing cache
        cache_data = {}
        if os.path.exists(self.cache_file):
            try:
                with open(self.cache_file, 'r', encoding='utf-8') as f:
                    cache_data = json.load(f)
            except Exception as e:
                print(f"Error loading embeddings cache: {e}")
                cache_data = {}

        updated_cache = {}
        all_chunks = []
        cache_needs_write = False

        if os.path.exists(self.kb_dir):
            doc_files = [f for f in os.listdir(self.kb_dir) if f.endswith('.md') or f.endswith('.pdf')]
        else:
            doc_files = []
        
        for file_name in doc_files:
            file_path = os.path.join(self.kb_dir, file_name)
            try:
                # Read content based on file type
                if file_name.endswith('.pdf'):
                    if not PdfReader:
                        print(f"Warning: pypdf not installed. Skipping {file_name}")
                        continue
                    reader = PdfReader(file_path)
                    content = "\n".join([page.extract_text() or "" for page in reader.pages])
                else:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                
                # Compute file content hash
                content_hash = hashlib.md5(content.encode('utf-8')).hexdigest()
                
                # Check if file has not changed and cache entry is valid
                # Also check that we aren't switching from a mock cache to a real API key cache
                is_mock_cached = cache_data.get(file_name, {}).get("is_mock", False)
                if (file_name in cache_data 
                    and cache_data[file_name].get("hash") == content_hash
                    and not (self.api_key_valid and is_mock_cached)):
                    # Load from cache
                    file_chunks = cache_data[file_name].get("chunks", [])
                    all_chunks.extend(file_chunks)
                    updated_cache[file_name] = cache_data[file_name]
                else:
                    # Re-chunk and re-embed
                    print(f"Indexing/Re-indexing guideline file: {file_name}")
                    
                    if file_name.endswith('.pdf'):
                        raw_chunks = self.split_text_by_chunks(content, file_name)
                    else:
                        raw_chunks = self.split_markdown_by_headings(content, file_name)
                    
                    if raw_chunks:
                        if self.api_key_valid and self.embeddings:
                            # Generate embeddings in batch
                            texts = [chunk["text"] for chunk in raw_chunks]
                            embeddings_list = self.embeddings.embed_documents(texts)
                            for chunk, emb in zip(raw_chunks, embeddings_list):
                                chunk["embedding"] = emb
                            
                            updated_cache[file_name] = {
                                "hash": content_hash,
                                "is_mock": False,
                                "chunks": raw_chunks
                            }
                            all_chunks.extend(raw_chunks)
                            cache_needs_write = True
                        else:
                            # Fallback/Mock mode when no API Key is set
                            for chunk in raw_chunks:
                                chunk["embedding"] = [0.0] * 1536
                            updated_cache[file_name] = {
                                "hash": content_hash,
                                "is_mock": True,
                                "chunks": raw_chunks
                            }
                            all_chunks.extend(raw_chunks)
                            print(f"Indexed {file_name} with dummy embeddings (No API Key).")
            except Exception as e:
                print(f"Error indexing file {file_name}: {e}")

        self.chunks = all_chunks

        # Write to cache if we updated anything and have real API key
        if cache_needs_write and self.api_key_valid:
            try:
                with open(self.cache_file, 'w', encoding='utf-8') as f:
                    json.dump(updated_cache, f, ensure_ascii=False, indent=2)
                print(f"Successfully updated embeddings cache at: {self.cache_file}")
            except Exception as e:
                print(f"Error saving embeddings cache: {e}")

    def cosine_similarity(self, v1: List[float], v2: List[float]) -> float:
        dot_product = sum(a * b for a, b in zip(v1, v2))
        norm_v1 = math.sqrt(sum(a * a for a in v1))
        norm_v2 = math.sqrt(sum(b * b for b in v2))
        if not norm_v1 or not norm_v2:
            return 0.0
        return dot_product / (norm_v1 * norm_v2)

    def search(self, query: str, k: int = 2) -> List[Dict[str, Any]]:
        if not self.chunks:
            return []

        # If API key is not valid, use simple word overlap search
        if not self.api_key_valid or not self.embeddings:
            return self.mock_keyword_search(query, k)

        try:
            query_embedding = self.embeddings.embed_query(query)
        except Exception as e:
            print(f"Error embedding query: {e}. Falling back to keyword search.")
            return self.mock_keyword_search(query, k)

        results = []
        for chunk in self.chunks:
            emb = chunk.get("embedding")
            if not emb or len(emb) != len(query_embedding):
                continue
            similarity = self.cosine_similarity(query_embedding, emb)
            results.append({
                "source": chunk["source"],
                "title": chunk["title"],
                "heading": chunk["heading"],
                "text": chunk["text"],
                "score": similarity
            })

        # Sort by similarity score descending
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:k]

    def mock_keyword_search(self, query: str, k: int = 2) -> List[Dict[str, Any]]:
        query_words = set(query.lower().split())
        results = []
        for chunk in self.chunks:
            chunk_text = chunk["text"].lower()
            overlap = sum(1 for word in query_words if word in chunk_text)
            score = overlap / len(query_words) if query_words else 0
            results.append({
                "source": chunk["source"],
                "title": chunk["title"],
                "heading": chunk["heading"],
                "text": chunk["text"],
                "score": score
            })
        results.sort(key=lambda x: x["score"], reverse=True)
        # Filter results with score > 0 to avoid returning random unrelated docs
        filtered_results = [r for r in results if r["score"] > 0]
        return filtered_results[:k]
