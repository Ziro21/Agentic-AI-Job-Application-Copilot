import re

def extract_yoe(text: str) -> int | None:
    """
    Parses unstructured job descriptions to figure out how many years of experience are required.
    Returns the minimum integer found that fits the context.
    """
    if not text:
        return None
        
    text = text.lower()
    
    # Matches patterns like "5+ years of experience", "3 to 4 years experience", "3-5 yrs"
    patterns = [
        r'(\d+)(?:\+|-)?[ ]*(?:to|-)[ ]*\d+[ ]*years?(?:[a-z ]*)?(?:experience|exp)',
        r'(\d+)(?:\+|-)?[ ]*years?(?:[a-z ]*)?(?:experience|exp)',
        r'(?:experience|exp)[a-z ]*(\d+)(?:\+|-)?[ ]*years?',
        r'(\d+)(?:\+|-)?[ ]*yrs',
        r'minimum(?: of)* (\d+)[a-z]* years?'
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, text)
        if matches:
            try:
                # Often texts have multiple requirements (e.g. "5 years general, 2 years specific")
                # Grabbing the max requirement is safer for Copilot matching
                values = [int(m) for m in matches if m.isdigit()]
                valid_values = [v for v in values if v < 20] # sanity check (preventing years like 2019)
                if valid_values:
                    return max(valid_values)
            except ValueError:
                pass

    return None

def extract_skills(text: str) -> list[str]:
    """
    Detects strict predefined tech stack keywords from the description to populate into a JSONB array.
    """
    if not text:
        return []
        
    skills_map = {
        "python": "Python", "java": "Java", "c++": "C++", "c#": "C#", 
        "javascript": "JavaScript", "typescript": "TypeScript", "golang": "Go", "rust": "Rust",
        "sql": "SQL", "nosql": "NoSQL", "postgres": "PostgreSQL",
        "aws": "AWS", "gcp": "GCP", "azure": "Azure",
        "docker": "Docker", "kubernetes": "Kubernetes", "k8s": "Kubernetes",
        "react": "React", "vue": "Vue", "angular": "Angular",
        "pytorch": "PyTorch", "tensorflow": "TensorFlow", "scikit-learn": "Scikit-Learn",
        "ci/cd": "CI/CD", "graphql": "GraphQL", "kafka": "Kafka"
    }
    
    found = set()
    text_lower = text.lower()
    
    for raw_skill, canonical in skills_map.items():
        # Handle exact word boundaries safely
        # E.g. don't match 'go' indiscriminately from the english language without padding
        if raw_skill == "go":
            pattern = r'\b(go|golang)\b'
        elif raw_skill == "c++":
            pattern = r'c\+\+'
        else:
            pattern = r'\b' + re.escape(raw_skill) + r'\b'
            
        if re.search(pattern, text_lower):
            found.add(canonical)
            
    return sorted(list(found))
